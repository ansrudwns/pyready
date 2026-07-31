import assert from "node:assert/strict";
import test from "node:test";
import { checkShortAnswer } from "../src/grading.js";

test("정확한 답과 앞뒤 공백만 있는 답은 정답이다", () => {
  assert.equal(checkShortAnswer("Hello, World!", "Hello, World!"), true);
  assert.equal(checkShortAnswer("Hello, World!", "  Hello, World!  "), true);
});

test("대소문자가 다르면 오답이다", () => {
  assert.equal(checkShortAnswer("True", "true"), false);
  assert.equal(checkShortAnswer("None", "none"), false);
});

test("숫자 표현이 다르면 오답이다", () => {
  assert.equal(checkShortAnswer("15", "15.0"), false);
});

test("따옴표를 임의로 추가하면 오답이다", () => {
  assert.equal(checkShortAnswer("Hello, World!", '"Hello, World!"'), false);
});

test("컨테이너의 공백과 순서가 다르면 오답이다", () => {
  assert.equal(checkShortAnswer("[1, 2]", "[1,2]"), false);
  assert.equal(checkShortAnswer("{'a': 1, 'b': 2}", "{'b': 2, 'a': 1}"), false);
});

test("정답 외 설명을 덧붙이면 오답이다", () => {
  assert.equal(checkShortAnswer("Hello, World!", "Hello, World!가 출력됩니다."), false);
});

test("운영체제 줄바꿈 차이만 정규화한다", () => {
  assert.equal(checkShortAnswer("A\nB", "A\r\nB"), true);
});

test("여러 줄 출력을 공백 한 줄로 바꾸면 오답이다", () => {
  assert.equal(checkShortAnswer("A\nB", "A B"), false);
  assert.equal(checkShortAnswer("A\nB", "A\nB"), true);
});
