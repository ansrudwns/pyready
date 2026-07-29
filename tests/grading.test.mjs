import assert from "node:assert/strict";
import test from "node:test";
import { checkShortAnswer } from "../src/grading.js";

test("숫자 표현 차이를 허용한다", () => {
  assert.equal(checkShortAnswer("15", "15.0"), true);
});

test("리스트와 튜플의 종류는 구분한다", () => {
  assert.equal(checkShortAnswer("[1, 2]", "[1,2]"), true);
  assert.equal(checkShortAnswer("(1, 2)", "[1, 2]"), false);
});

test("한 요소 튜플의 공백을 허용한다", () => {
  assert.equal(checkShortAnswer("('Alice',)", '( "Alice" , )'), true);
});

test("딕셔너리 키 순서와 따옴표 차이를 허용한다", () => {
  assert.equal(
    checkShortAnswer("{'name': 'Jane', 'age': 20}", '{"age":20, "name":"Jane"}'),
    true,
  );
});

test("집합 요소 순서를 무시한다", () => {
  assert.equal(checkShortAnswer("{1, 2, 3}", "{3,1,2}"), true);
});

test("여러 줄 출력은 공백 입력과 같게 처리한다", () => {
  assert.equal(checkShortAnswer("25 10", "25\n10"), true);
});

test("불리언과 None은 대소문자 차이를 허용한다", () => {
  assert.equal(checkShortAnswer("False", "false"), true);
  assert.equal(checkShortAnswer("None", "none"), true);
});

test("실제 값이 다르면 오답이다", () => {
  assert.equal(checkShortAnswer("{'a': 1}", "{'a': 2}"), false);
});
