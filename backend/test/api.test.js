import assert from "node:assert/strict";
import crypto from "node:crypto";
import { after, before, beforeEach, describe, test } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://unused";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-test";
process.env.AI_SERVER_URL = "http://ai.invalid";

const { default: env } = await import("../src/config/env.js");
const { createApp } = await import("../src/app.js");
const { createContainer } = await import("../src/container.js");
const { default: User } = await import("../src/models/user.model.js");

const sentEmails = [];
const tavusCalls = { created: 0, ended: 0 };

const fakes = {
  emailSender: { send: async (message) => void sentEmails.push(message) },
  google: {
    verify: async (credential) => ({
      googleId: `g-${credential}`,
      email: `${credential}@gmail.com`,
      firstName: "Goo",
      lastName: "Gle",
    }),
  },
  ai: {
    warmUp() {},
    generateRoadmap: async () =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((id) => ({
        id,
        title: `Chapter ${id}`,
        description: "d",
        learning_objectives: ["o"],
        difficulty: 1,
        estimated_minutes: 5,
        status: id === 1 ? "READY" : "LOCKED",
      })),
    generateScript: async () => "A lecture script with α-helix → β-sheet.",
    generateNotes: async ({ doubts }) => `Key ideas\n- α-helix\n- doubts: ${doubts.length}`,
    answerDoubt: async ({ question }) => `Answer to ${question}`,
  },
  tavus: {
    isConfigured: true,
    createConversation: async () => {
      tavusCalls.created += 1;
      return {
        conversation_id: `c${tavusCalls.created}`,
        conversation_url: `https://tavus.daily.co/c${tavusCalls.created}`,
      };
    },
    getConversation: async () => ({ status: "active" }),
    endConversation: async () => void (tavusCalls.ended += 1),
  },
};

let mongod, server, base;

const call = async (path, { method = "GET", body, token, cookie } = {}) => {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const type = response.headers.get("content-type") ?? "";
  const data = type.includes("json") ? await response.json() : await response.arrayBuffer();
  return { status: response.status, data, headers: response.headers };
};

const lastCode = () => sentEmails.at(-1).text.match(/\b\d{6}\b/)[0];

const student = (overrides = {}) => ({
  firstName: "Asha",
  lastName: "Rao",
  email: "asha@example.com",
  phone: "9876543210",
  dob: "2004-05-01",
  password: "learning1",
  ...overrides,
});

const signUp = async (overrides) => {
  const input = student(overrides);
  await call("/auth/register", { method: "POST", body: input });
  const verified = await call("/auth/verify-email", {
    method: "POST",
    body: { email: input.email, otp: lastCode() },
  });
  return verified.data.accessToken;
};

const planFor = async (token) => {
  const { data } = await call("/roadmap/generate", {
    method: "POST",
    token,
    body: { topics: ["DNA"], duration: 40, pace: "slow", tone: "beginner" },
  });
  return data.roadmap;
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  const app = createApp(env, createContainer(env, fakes));
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  sentEmails.length = 0;
  tavusCalls.created = 0;
  tavusCalls.ended = 0;
});

describe("email sign-up and sign-in", () => {
  test("register, verify with code, then sign in", async () => {
    assert.equal((await call("/auth/register", { method: "POST", body: student() })).status, 201);

    const blocked = await call("/auth/login", {
      method: "POST",
      body: { email: "asha@example.com", password: "learning1" },
    });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.data.code, "EMAIL_NOT_VERIFIED");

    const verified = await call("/auth/verify-email", {
      method: "POST",
      body: { email: "asha@example.com", otp: lastCode() },
    });
    assert.equal(verified.status, 200);
    assert.ok(verified.data.accessToken);

    const login = await call("/auth/login", {
      method: "POST",
      body: { email: "ASHA@example.com", password: "learning1" },
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/i);
    assert.equal(login.data.user.password, undefined);
  });

  test("several email users can register (null googleId index regression)", async () => {
    for (const n of [1, 2, 3]) {
      const response = await call("/auth/register", {
        method: "POST",
        body: student({ email: `s${n}@example.com`, phone: `900000000${n}` }),
      });
      assert.equal(response.status, 201);
    }
  });

  test("a failed email does not lock the address", async () => {
    const send = fakes.emailSender.send;
    fakes.emailSender.send = async () => {
      throw new Error("mail is down");
    };
    assert.equal((await call("/auth/register", { method: "POST", body: student() })).status, 500);
    fakes.emailSender.send = send;
    assert.equal((await call("/auth/register", { method: "POST", body: student() })).status, 201);
  });

  test("passwords with 0 or # are accepted, weak ones rejected", async () => {
    const ok = await call("/auth/register", {
      method: "POST",
      body: student({ password: "pass#word0" }),
    });
    assert.equal(ok.status, 201);
    const weak = await call("/auth/register", {
      method: "POST",
      body: student({ email: "b@example.com", phone: "9000000009", password: "short" }),
    });
    assert.equal(weak.status, 400);
  });

  test("legacy SHA-256 password still works and is upgraded to bcrypt", async () => {
    await User.create({
      ...student(),
      verified: true,
      password: crypto.createHash("sha256").update("learning1").digest("hex"),
    });
    const body = { email: "asha@example.com", password: "learning1" };
    assert.equal((await call("/auth/login", { method: "POST", body })).status, 200);
    const stored = await User.findOne({ email: body.email }).select("+password");
    assert.match(stored.password, /^\$2/);
    assert.equal((await call("/auth/login", { method: "POST", body })).status, 200);
  });

  test("NoSQL operator injection is rejected", async () => {
    const response = await call("/auth/login", {
      method: "POST",
      body: { email: { $ne: null }, password: { $ne: null } },
    });
    assert.equal(response.status, 400);
  });

  test("OTP is deleted after five wrong guesses", async () => {
    await call("/auth/register", { method: "POST", body: student() });
    const code = lastCode();
    const wrong = code === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i += 1) {
      await call("/auth/verify-email", {
        method: "POST",
        body: { email: "asha@example.com", otp: wrong },
      });
    }
    const response = await call("/auth/verify-email", {
      method: "POST",
      body: { email: "asha@example.com", otp: code },
    });
    assert.equal(response.status, 400);
  });

  test("password reset works, revokes sessions, hides unknown emails", async () => {
    const token = await signUp();
    const unknown = await call("/auth/forgot-password", {
      method: "POST",
      body: { email: "nobody@example.com" },
    });
    assert.equal(unknown.status, 200);

    await call("/auth/forgot-password", { method: "POST", body: { email: "asha@example.com" } });
    const reset = await call("/auth/reset-password", {
      method: "POST",
      body: { email: "asha@example.com", otp: lastCode(), newPassword: "newpassword1" },
    });
    assert.equal(reset.status, 200);
    assert.equal((await call("/auth/me", { token })).status, 401);
    const login = await call("/auth/login", {
      method: "POST",
      body: { email: "asha@example.com", password: "newpassword1" },
    });
    assert.equal(login.status, 200);
  });
});

describe("Google sign-in", () => {
  test("creates a user and links an existing email account", async () => {
    const created = await call("/auth/google", { method: "POST", body: { credential: "new" } });
    assert.equal(created.status, 200);
    assert.equal(created.data.user.email, "new@gmail.com");

    await signUp({ email: "asha@gmail.com" });
    const linked = await call("/auth/google", { method: "POST", body: { credential: "asha" } });
    assert.equal(linked.status, 200);
    assert.equal(await User.countDocuments({ email: "asha@gmail.com" }), 1);
  });
});

describe("sessions", () => {
  const session = async () => {
    await signUp();
    const login = await call("/auth/login", {
      method: "POST",
      body: { email: "asha@example.com", password: "learning1" },
    });
    return login.headers.get("set-cookie").split(";")[0];
  };

  test("refresh restores the user; concurrent refreshes both succeed", async () => {
    const cookie = await session();
    const [first, second] = await Promise.all([
      call("/auth/refresh", { method: "POST", cookie }),
      call("/auth/refresh", { method: "POST", cookie }),
    ]);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(first.data.user.email, "asha@example.com");
  });

  test("logout revokes the session and refresh without a cookie is 401, not 500", async () => {
    const cookie = await session();
    await call("/auth/logout", { method: "POST", cookie });
    assert.equal((await call("/auth/refresh", { method: "POST", cookie })).status, 401);
    assert.equal((await call("/auth/refresh", { method: "POST" })).status, 401);
    assert.equal((await call("/auth/me", { token: "garbage" })).status, 401);
  });
});

describe("roadmap and sequential lock", () => {
  test("later chapters stay locked until the previous one is complete", async () => {
    const token = await signUp();
    const roadmap = await planFor(token);
    assert.equal(roadmap.chapters.length, 8);

    const start = (chapterIndex) =>
      call("/lesson/start", {
        method: "POST",
        token,
        body: { roadmapId: roadmap._id, chapterIndex },
      });

    const locked = await start(1);
    assert.equal(locked.status, 403);
    assert.equal(locked.data.code, "CHAPTER_LOCKED");

    const first = await start(0);
    assert.equal(first.status, 200);
    await call(`/lesson/${first.data.lesson.id}/complete`, { method: "POST", token });
    assert.equal(tavusCalls.ended, 1);
    assert.equal((await start(1)).status, 200);
  });

  test("the seventh and eighth chapters are reachable", async () => {
    const token = await signUp();
    const roadmap = await planFor(token);
    for (let chapterIndex = 0; chapterIndex < 8; chapterIndex += 1) {
      const { status, data } = await call("/lesson/start", {
        method: "POST",
        token,
        body: { roadmapId: roadmap._id, chapterIndex },
      });
      assert.equal(status, 200);
      await call(`/lesson/${data.lesson.id}/complete`, { method: "POST", token });
    }
    const { data } = await call("/dashboard", { token });
    assert.equal(data.completed, 8);
    assert.equal(data.nextChapter, null);
  });

  test("a double start creates one lesson and one Tavus conversation", async () => {
    const token = await signUp();
    const roadmap = await planFor(token);
    const body = { roadmapId: roadmap._id, chapterIndex: 0 };
    const [a, b] = await Promise.all([
      call("/lesson/start", { method: "POST", token, body }),
      call("/lesson/start", { method: "POST", token, body }),
    ]);
    assert.equal(a.data.lesson.id, b.data.lesson.id);
    assert.equal(tavusCalls.created, 1);
    await call("/lesson/start", { method: "POST", token, body });
    assert.equal(tavusCalls.created, 1);
  });

  test("the lesson still opens when Tavus fails", async () => {
    const token = await signUp();
    const roadmap = await planFor(token);
    const create = fakes.tavus.createConversation;
    fakes.tavus.createConversation = async () => {
      throw new Error("out of credits");
    };
    const { status, data } = await call("/lesson/start", {
      method: "POST",
      token,
      body: { roadmapId: roadmap._id, chapterIndex: 0 },
    });
    fakes.tavus.createConversation = create;
    assert.equal(status, 200);
    assert.equal(data.tavusAvailable, false);
    assert.ok(data.lesson.script);
    assert.ok(!data.tavusError.includes("credits"));
  });
});

describe("doubts, notes and QR sharing", () => {
  const openLesson = async (overrides) => {
    const token = await signUp(overrides);
    const roadmap = await planFor(token);
    const { data } = await call("/lesson/start", {
      method: "POST",
      token,
      body: { roadmapId: roadmap._id, chapterIndex: 0 },
    });
    return { token, lessonId: data.lesson.id };
  };

  test("a doubt is answered, saved, and included in regenerated notes", async () => {
    const { token, lessonId } = await openLesson();
    const doubt = await call(`/lesson/${lessonId}/doubt`, {
      method: "POST",
      token,
      body: { question: "Why?" },
    });
    assert.equal(doubt.data.answer, "Answer to Why?");

    const notes = await call(`/lesson/${lessonId}/notes`, {
      method: "POST",
      token,
      body: { force: true },
    });
    assert.match(notes.data.notes, /doubts: 1/);
  });

  test("notes PDF downloads and renders Greek letters without crashing", async () => {
    const { token, lessonId } = await openLesson();
    await call(`/lesson/${lessonId}/notes`, { method: "POST", token, body: {} });
    const pdf = await call(`/lesson/${lessonId}/notes.pdf`, { token });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get("content-type"), "application/pdf");
    assert.equal(Buffer.from(pdf.data).subarray(0, 4).toString(), "%PDF");
  });

  test("QR token opens the lesson on a phone with no sign-in", async () => {
    const { token, lessonId } = await openLesson();
    await call(`/lesson/${lessonId}/notes`, { method: "POST", token, body: {} });
    const share = await call(`/lesson/${lessonId}/share`, { method: "POST", token });

    const shared = await call(`/lesson/shared/${share.data.token}`);
    assert.equal(shared.status, 200);
    assert.ok(shared.data.conversationUrl);
    assert.equal(shared.data.hasNotes, true);
    assert.equal(shared.data.script, undefined);

    const pdf = await call(`/lesson/shared/${share.data.token}/notes.pdf`);
    assert.equal(pdf.status, 200);
  });

  test("a raw lesson id or tampered token gives no access", async () => {
    const { lessonId } = await openLesson();
    assert.equal((await call(`/lesson/shared/${lessonId}`)).status, 410);
    assert.equal((await call(`/lesson/shared/${lessonId}/notes.pdf`)).status, 410);
  });

  test("another student cannot touch someone else's lesson", async () => {
    const { lessonId } = await openLesson();
    const other = await signUp({ email: "other@example.com", phone: "9111111111" });
    for (const path of ["complete", "doubt", "notes", "share"]) {
      const { status } = await call(`/lesson/${lessonId}/${path}`, {
        method: "POST",
        token: other,
        body: { question: "x" },
      });
      assert.equal(status, 404, path);
    }
  });
});

describe("dashboard", () => {
  test("handles no roadmap, then shows the next chapter", async () => {
    const token = await signUp();
    assert.equal((await call("/dashboard", { token })).data.roadmap, null);
    await planFor(token);
    const { data } = await call("/dashboard", { token });
    assert.deepEqual(data.nextChapter, { index: 0, title: "Chapter 1" });
    assert.equal(data.total, 8);
  });

  test("profile update ignores fields outside the allowed list", async () => {
    const token = await signUp();
    await call("/dashboard/profile", {
      method: "PUT",
      token,
      body: { firstName: "New", verified: false, email: "x@y.z" },
    });
    const { data } = await call("/auth/me", { token });
    assert.equal(data.user.firstName, "New");
    assert.equal(data.user.email, "asha@example.com");
    assert.equal(data.user.verified, true);
  });
});
