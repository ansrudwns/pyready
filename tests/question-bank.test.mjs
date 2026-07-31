import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

async function loadQuestionBank() {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const result = await build({
    stdin: {
      contents: source,
      loader: "tsx",
      resolveDir: fileURLToPath(new URL("../app", import.meta.url)),
      sourcefile: "page.tsx",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString("base64")}`;
  return (await import(moduleUrl)).questionBank;
}

const questionBank = await loadQuestionBank();
const allowedKinds = new Set(["객관식", "단답형", "서술형"]);
const allowedCategories = new Set([
  "연산자·형변환",
  "문자열·시퀀스",
  "제어문",
  "함수·스코프",
  "자료구조",
  "OOP",
  "예외처리",
]);

test("문제은행은 정확히 100문항이며 ID가 중복되지 않는다", () => {
  assert.equal(questionBank.length, 100);
  assert.equal(new Set(questionBank.map(({ id }) => id)).size, questionBank.length);
});

test("모든 문항은 필수 내용과 허용된 분류를 가진다", () => {
  for (const question of questionBank) {
    assert.ok(question.id.trim(), "문항 ID가 비어 있습니다.");
    assert.ok(question.question.trim(), `${question.id}: 문제 본문이 비어 있습니다.`);
    assert.ok(question.answer.trim(), `${question.id}: 정답이 비어 있습니다.`);
    assert.ok(question.explanation.trim(), `${question.id}: 해설이 비어 있습니다.`);
    assert.ok(allowedKinds.has(question.kind), `${question.id}: 알 수 없는 문제 유형입니다.`);
    assert.ok(allowedCategories.has(question.category), `${question.id}: 알 수 없는 분야입니다.`);
  }
});

test("객관식은 4지선다이며 정답이 보기에 정확히 한 번 포함된다", () => {
  for (const question of questionBank.filter(({ kind }) => kind === "객관식")) {
    assert.equal(question.choices?.length, 4, `${question.id}: 객관식 보기는 4개여야 합니다.`);
    assert.equal(
      question.choices.filter((choice) => choice === question.answer).length,
      1,
      `${question.id}: 정답은 보기에 정확히 한 번 포함되어야 합니다.`,
    );
    assert.equal(new Set(question.choices).size, 4, `${question.id}: 중복 보기가 있습니다.`);
  }
});

test("서술형은 자동 채점 보기가 없고 모범답안이 100자 이상이다", () => {
  for (const question of questionBank.filter(({ kind }) => kind === "서술형")) {
    assert.equal(question.choices, undefined, `${question.id}: 서술형에 객관식 보기가 남아 있습니다.`);
    assert.ok(question.answer.trim().length >= 100, `${question.id}: 모범답안이 100자보다 짧습니다.`);
  }
});

test("문제 문장은 완전히 중복되지 않는다", () => {
  const normalized = questionBank.map(({ question }) => question.replace(/\s+/g, " ").trim());
  assert.equal(new Set(normalized).size, normalized.length);
});

test("여러 줄 정답 문항은 줄바꿈 입력을 명시한다", () => {
  const multiline = questionBank.filter(({ answer }) => answer.includes("\n"));
  assert.equal(multiline.length, 5);
  for (const question of multiline) {
    assert.match(question.question, /줄바꿈/, `${question.id}: 줄바꿈 입력 안내가 없습니다.`);
  }
});

test("모든 해설은 핵심 근거를 설명할 만큼 충분히 구체적이다", () => {
  const tooShort = questionBank
    .filter(({ explanation }) => explanation.trim().length < 70)
    .map(({ id, explanation }) => `${id}(${explanation.trim().length}자)`);
  assert.deepEqual(tooShort, [], `70자보다 짧은 해설: ${tooShort.join(", ")}`);
});
