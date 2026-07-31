"use client";

import { useEffect, useMemo, useState } from "react";
import { checkShortAnswer } from "../src/grading.js";

type Kind = "객관식" | "단답형" | "서술형";
type Category =
  | "연산자·형변환"
  | "문자열·시퀀스"
  | "제어문"
  | "함수·스코프"
  | "자료구조"
  | "OOP"
  | "예외처리";

type Question = {
  id: string;
  category: Category;
  kind: Kind;
  question: string;
  code?: string;
  choices?: string[];
  answer: string;
  explanation: string;
  difficulty?: "기초" | "핵심" | "사고형" | "고난도";
};

type History = {
  date: string;
  score: number;
  total: number;
  mode: string;
};

type QuestionCount = 10 | 20 | 30 | "all";
type TimeLimit = 60 | null;

const categories: Category[] = [
  "연산자·형변환",
  "문자열·시퀀스",
  "제어문",
  "함수·스코프",
  "자료구조",
  "OOP",
  "예외처리",
];

const accent: Record<Category, string> = {
  "연산자·형변환": "#ef8354",
  "문자열·시퀀스": "#3a86ff",
  제어문: "#06a77d",
  "함수·스코프": "#8b5cf6",
  자료구조: "#e4a11b",
  OOP: "#e5526b",
  예외처리: "#526477",
};

const baseQuestions: Question[] = [
  {
    id: "op-1",
    category: "연산자·형변환",
    kind: "객관식",
    question: "다음 표현식의 실행 결과로 올바른 것은?",
    code: "print(17 // 4 + 17 % 4 * 2)",
    choices: ["5", "6", "10", "12"],
    answer: "6",
    explanation:
      "//와 %가 +보다 먼저 계산됩니다. 17 // 4는 4, 17 % 4는 1이므로 4 + 1 × 2의 결과는 6입니다.",
  },
  {
    id: "op-2",
    category: "연산자·형변환",
    kind: "객관식",
    question: "다음 코드의 출력 결과는?",
    code: 'print("" or "Python")',
    choices: ["True", "False", "Python", ""],
    answer: "Python",
    explanation:
      "or는 항상 bool을 반환하지 않습니다. 첫 값이 falsy이면 두 번째 피연산자를 반환합니다.",
  },
  {
    id: "op-3",
    category: "연산자·형변환",
    kind: "단답형",
    question: "출력 결과를 공백까지 정확히 작성하세요.",
    code: 'value = "24"\nprint(int(value) + 3, type(value).__name__)',
    answer: "27 str",
    explanation:
      "int(value)는 새 정수를 만들 뿐 value 자체를 변경하지 않으므로 원래 타입은 str입니다.",
  },
  {
    id: "seq-1",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "다음 코드의 출력 결과는?",
    code: 'text = "developer"\nprint(text[1::2])',
    answer: "eeoe",
    explanation: "인덱스 1부터 시작해 두 칸 간격으로 문자를 선택합니다.",
  },
  {
    id: "seq-2",
    category: "문자열·시퀀스",
    kind: "객관식",
    question: "변경 가능한 객체만으로 이루어진 보기는?",
    choices: [
      "str, tuple, range",
      "list, dict, set",
      "list, tuple, set",
      "dict, str, list",
    ],
    answer: "list, dict, set",
    explanation: "list, dict, set은 mutable이며 str, tuple, range는 immutable입니다.",
  },
  {
    id: "seq-3",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "메서드 체이닝의 최종 출력 결과를 작성하세요.",
    code: 'print("  Code Review  ".strip().lower().replace(" ", "_"))',
    answer: "code_review",
    explanation: "strip → lower → replace 순서로 각각 새 문자열을 반환합니다.",
  },
  {
    id: "flow-1",
    category: "제어문",
    kind: "단답형",
    question: "다음 코드의 출력 결과는?",
    code:
      "total = 0\nfor i in range(1, 8):\n    if i % 3 == 0:\n        continue\n    total += i\nprint(total)",
    answer: "19",
    explanation: "3과 6을 제외한 1, 2, 4, 5, 7의 합은 19입니다.",
  },
  {
    id: "flow-2",
    category: "제어문",
    kind: "객관식",
    question: "현재 반복만 건너뛰고 다음 반복으로 진행하는 키워드는?",
    choices: ["break", "continue", "pass", "return"],
    answer: "continue",
    explanation: "break는 반복 전체 종료, pass는 아무 일도 하지 않는 자리 표시자입니다.",
  },
  {
    id: "flow-3",
    category: "제어문",
    kind: "단답형",
    question: "중첩 반복문이 출력하는 값은?",
    code:
      "count = 0\nfor i in range(3):\n    for j in range(3):\n        if i == j:\n            continue\n        count += 1\nprint(count)",
    answer: "6",
    explanation: "전체 9개 조합 중 i와 j가 같은 3개를 제외하면 6개입니다.",
  },
  {
    id: "func-1",
    category: "함수·스코프",
    kind: "단답형",
    question: "줄바꿈으로 출력되는 두 값을 순서대로 작성하세요.",
    code:
      "number = 10\n\ndef change():\n    number = 25\n    print(number)\n\nchange()\nprint(number)",
    answer: "25 10",
    explanation:
      "함수 내부 대입은 지역 변수를 만듭니다. global이 없으므로 전역 number는 바뀌지 않습니다.",
  },
  {
    id: "func-2",
    category: "함수·스코프",
    kind: "객관식",
    question: "함수 안에서 전역 변수에 새 값을 대입할 때 필요한 키워드는?",
    choices: ["return", "global", "nonlocal", "yield"],
    answer: "global",
    explanation: "global 변수명 선언 후 전역 변수에 대입할 수 있습니다.",
  },
  {
    id: "func-3",
    category: "함수·스코프",
    kind: "서술형",
    question: "return과 print의 차이를 10자 이상으로 설명하세요.",
    answer: "return은 값을 반환하고 print는 화면에 출력한다",
    explanation:
      "return은 함수 실행을 끝내고 값을 호출자에게 전달하지만 print는 화면 출력만 수행합니다.",
  },
  {
    id: "data-1",
    category: "자료구조",
    kind: "단답형",
    question: "다음 코드의 출력 결과는?",
    code:
      "numbers = [3, 1, 4]\nresult = numbers.append(2)\nprint(result, numbers)",
    answer: "None [3, 1, 4, 2]",
    explanation: "append는 원본 리스트를 변경하고 None을 반환합니다.",
  },
  {
    id: "data-2",
    category: "자료구조",
    kind: "객관식",
    question: "원본을 바꾸지 않고 정렬된 새 리스트를 반환하는 표현은?",
    choices: [
      "numbers.sort()",
      "sorted(numbers)",
      "numbers.reverse()",
      "numbers.append()",
    ],
    answer: "sorted(numbers)",
    explanation: "list.sort()는 원본을 변경하고 None을 반환합니다.",
  },
  {
    id: "data-3",
    category: "자료구조",
    kind: "단답형",
    question: "딕셔너리 집계 코드의 출력 결과는?",
    code:
      "counts = {}\nfor fruit in ['apple', 'banana', 'apple']:\n    counts[fruit] = counts.get(fruit, 0) + 1\nprint(counts['apple'], counts.get('melon', -1))",
    answer: "2 -1",
    explanation: "get은 키가 없을 때 지정한 기본값을 반환합니다.",
  },
  {
    id: "data-4",
    category: "자료구조",
    kind: "단답형",
    question: "리스트 컴프리헨션의 출력 결과는?",
    code: "print([i ** 2 for i in range(7) if i % 2 == 0])",
    answer: "[0, 4, 16, 36]",
    explanation: "0부터 6까지 중 짝수만 선택한 뒤 제곱합니다.",
  },
  {
    id: "oop-1",
    category: "OOP",
    kind: "객관식",
    question: "클래스 메서드의 데코레이터와 첫 매개변수 조합은?",
    choices: [
      "@classmethod, cls",
      "@staticmethod, self",
      "@classmethod, self",
      "@property, cls",
    ],
    answer: "@classmethod, cls",
    explanation: "클래스 메서드는 클래스 자체를 관례상 cls로 받습니다.",
  },
  {
    id: "oop-2",
    category: "OOP",
    kind: "단답형",
    question: "다음 코드의 출력 결과는?",
    code:
      'class Animal:\n    def sound(self):\n        return "동물"\n\nclass Dog(Animal):\n    def sound(self):\n        return "멍멍"\n\nprint(Dog().sound())',
    answer: "멍멍",
    explanation: "자식 클래스에서 같은 이름의 메서드를 오버라이딩했습니다.",
  },
  {
    id: "oop-3",
    category: "OOP",
    kind: "객관식",
    question: "다중 상속에서 super()의 다음 호출 대상을 정하는 순서는?",
    choices: ["LEGB", "MRO", "FIFO", "변수 선언 순서"],
    answer: "MRO",
    explanation: "MRO(Method Resolution Order)는 클래스의 메서드 탐색 순서입니다.",
  },
  {
    id: "except-1",
    category: "예외처리",
    kind: "단답형",
    question: "출력되는 두 문구를 순서대로 작성하세요.",
    code:
      'try:\n    value = int("3.5")\nexcept ValueError:\n    print("변환 오류")\nfinally:\n    print("종료")',
    answer: "변환 오류 종료",
    explanation: "int('3.5')는 ValueError를 발생시키고 finally는 항상 실행됩니다.",
  },
  {
    id: "except-2",
    category: "예외처리",
    kind: "객관식",
    question: "여러 except를 작성할 때 올바른 원칙은?",
    choices: [
      "Exception을 항상 먼저 쓴다",
      "구체적인 예외를 먼저 쓴다",
      "finally 뒤에 except를 쓴다",
      "예외 이름을 모두 생략한다",
    ],
    answer: "구체적인 예외를 먼저 쓴다",
    explanation: "넓은 예외를 먼저 잡으면 뒤의 구체적인 처리문에 도달할 수 없습니다.",
  },
  {
    id: "except-3",
    category: "예외처리",
    kind: "서술형",
    question: "finally 블록이 언제 실행되는지 10자 이상으로 설명하세요.",
    answer: "예외 발생 여부와 관계없이 항상 실행된다",
    explanation: "finally는 정상 실행과 예외 발생 여부에 관계없이 마무리를 위해 실행됩니다.",
  },
];

const conceptQuestions: Question[] = [
  {
    id: "op-is-1",
    category: "연산자·형변환",
    kind: "객관식",
    question: "== 연산자와 is 연산자에 대한 설명으로 올바른 것은?",
    choices: [
      "==는 값의 동등성, is는 객체의 동일성을 비교한다",
      "==와 is는 언제나 같은 결과를 반환한다",
      "is는 값만 비교하고 ==는 메모리 주소를 비교한다",
      "문자열 비교에는 반드시 is를 사용한다",
    ],
    answer: "==는 값의 동등성, is는 객체의 동일성을 비교한다",
    explanation:
      "==는 두 객체의 값이 같은지 확인하고 is는 두 변수가 정확히 같은 객체를 가리키는지 확인합니다. None 비교에는 is None을 권장합니다.",
  },
  {
    id: "op-is-2",
    category: "연산자·형변환",
    kind: "단답형",
    question: "다음 코드의 출력 결과를 작성하세요.",
    code: "a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b, a is b, a is c)",
    answer: "True False True",
    explanation:
      "a와 b는 값은 같지만 서로 다른 리스트 객체입니다. c는 a가 가리키는 동일한 객체를 참조합니다.",
  },
  {
    id: "op-short-2",
    category: "연산자·형변환",
    kind: "단답형",
    question: "단락 평가가 적용된 출력 결과는?",
    code: "def check():\n    print('실행')\n    return True\n\nprint(False and check())",
    answer: "False",
    explanation:
      "and의 왼쪽이 False이면 전체 결과가 이미 결정되므로 check()는 호출되지 않고 '실행'도 출력되지 않습니다.",
  },
  {
    id: "op-short-3",
    category: "연산자·형변환",
    kind: "객관식",
    question: "다음 중 check()가 호출되는 표현식은?",
    choices: [
      "False and check()",
      "True or check()",
      "True and check()",
      "1 or check()",
    ],
    answer: "True and check()",
    explanation:
      "and는 왼쪽이 truthy일 때 오른쪽을 평가합니다. or는 왼쪽이 truthy이면 오른쪽을 평가하지 않습니다.",
  },
  {
    id: "op-truthy-1",
    category: "연산자·형변환",
    kind: "객관식",
    question: "다음 중 bool 값이 False인 것만 모인 보기는?",
    choices: ["0, '', [], None", "1, '0', [], None", "0, 'False', {}, ()", "False, [0], '', None"],
    answer: "0, '', [], None",
    explanation:
      "숫자 0, 빈 문자열·컨테이너, None은 falsy입니다. 내용이 하나라도 있는 문자열이나 리스트는 truthy입니다.",
  },
  {
    id: "op-float-1",
    category: "연산자·형변환",
    kind: "객관식",
    question: "0.1 + 0.2 == 0.3이 False가 될 수 있는 주된 이유는?",
    choices: [
      "컴퓨터가 실수를 이진 부동소수점으로 근사해 저장하기 때문",
      "Python에서 + 연산은 문자열만 지원하기 때문",
      "0.3이 정수로 자동 변환되기 때문",
      "==가 객체의 주소만 비교하기 때문",
    ],
    answer: "컴퓨터가 실수를 이진 부동소수점으로 근사해 저장하기 때문",
    explanation:
      "일부 10진 소수는 이진수로 정확하게 표현할 수 없어 미세한 오차가 생깁니다. math.isclose 같은 방법을 사용할 수 있습니다.",
  },
  {
    id: "op-membership-1",
    category: "연산자·형변환",
    kind: "단답형",
    question: "딕셔너리에 대한 in 연산의 출력 결과는?",
    code: "data = {'name': 'Kim', 'age': 20}\nprint('name' in data, 'Kim' in data)",
    answer: "True False",
    explanation:
      "딕셔너리에 in을 사용하면 기본적으로 값이 아니라 키의 포함 여부를 검사합니다.",
  },
  {
    id: "op-chain-1",
    category: "연산자·형변환",
    kind: "단답형",
    question: "비교 연산자 체이닝의 출력 결과는?",
    code: "x = 5\nprint(1 < x < 10, 1 < x > 10)",
    answer: "True False",
    explanation:
      "1 < x < 10은 1 < x and x < 10과 같습니다. 두 번째 표현식에서는 x > 10이 False입니다.",
  },
  {
    id: "seq-index-1",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "음수 인덱스와 역순 슬라이싱의 출력 결과는?",
    code: "text = 'python'\nprint(text[-1], text[::-1])",
    answer: "n nohtyp",
    explanation:
      "-1은 마지막 요소이며 슬라이스의 step을 -1로 두면 뒤에서 앞으로 순회합니다.",
  },
  {
    id: "seq-slice-copy",
    category: "문자열·시퀀스",
    kind: "객관식",
    question: "리스트 a가 있을 때 a[:]의 결과로 가장 적절한 설명은?",
    choices: [
      "최상위 리스트만 새로 만든 얕은 복사",
      "모든 중첩 객체까지 새로 만드는 깊은 복사",
      "원본 a와 완전히 동일한 객체",
      "항상 빈 리스트",
    ],
    answer: "최상위 리스트만 새로 만든 얕은 복사",
    explanation:
      "슬라이싱은 새 리스트를 만들지만 내부의 중첩 객체는 원본과 공유할 수 있습니다.",
  },
  {
    id: "seq-tuple-1",
    category: "문자열·시퀀스",
    kind: "객관식",
    question: "요소가 하나인 튜플을 올바르게 만드는 표현식은?",
    choices: ["(1)", "(1,)", "[1,]", "{1,}"],
    answer: "(1,)",
    explanation:
      "튜플을 결정하는 핵심은 괄호보다 쉼표입니다. (1)은 단순한 정수 1입니다.",
  },
  {
    id: "seq-range-1",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "range의 종료값과 음수 step을 주의해 출력 결과를 작성하세요.",
    code: "print(list(range(5, 0, -2)))",
    answer: "[5, 3, 1]",
    explanation:
      "range의 종료값은 포함하지 않으며 -2씩 감소해 5, 3, 1이 생성됩니다.",
  },
  {
    id: "seq-method-1",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "find와 index의 차이를 고려한 출력 결과는?",
    code: "text = 'python'\nprint(text.find('z'))",
    answer: "-1",
    explanation:
      "find는 문자를 찾지 못하면 -1을 반환합니다. index는 같은 상황에서 ValueError를 발생시킵니다.",
  },
  {
    id: "seq-string-immutable",
    category: "문자열·시퀀스",
    kind: "객관식",
    question: "문자열 메서드에 관한 설명으로 올바른 것은?",
    choices: [
      "replace는 원본 문자열을 직접 변경한다",
      "문자열은 불변이므로 메서드는 보통 새 문자열을 반환한다",
      "strip은 문자열 중간의 모든 공백을 제거한다",
      "split은 항상 문자열 하나를 반환한다",
    ],
    answer: "문자열은 불변이므로 메서드는 보통 새 문자열을 반환한다",
    explanation:
      "문자열은 immutable입니다. replace, strip, lower 등의 결과를 사용하려면 반환값을 저장해야 합니다.",
  },
  {
    id: "flow-break-else",
    category: "제어문",
    kind: "단답형",
    question: "for-else의 동작을 고려해 출력 결과를 작성하세요.",
    code: "for number in [1, 3, 5]:\n    if number % 2 == 0:\n        break\nelse:\n    print('완료')",
    answer: "완료",
    explanation:
      "반복문이 break 없이 정상 종료되면 else가 실행됩니다. 반복 횟수가 0이어도 break가 없으므로 실행됩니다.",
  },
  {
    id: "flow-pass-1",
    category: "제어문",
    kind: "객관식",
    question: "pass에 대한 설명으로 올바른 것은?",
    choices: [
      "반복문을 즉시 종료한다",
      "현재 반복을 건너뛴다",
      "문법적으로 문장이 필요한 자리에 아무 동작 없이 사용한다",
      "함수에서 None을 명시적으로 반환한다",
    ],
    answer: "문법적으로 문장이 필요한 자리에 아무 동작 없이 사용한다",
    explanation:
      "pass는 아무 동작도 하지 않습니다. break나 continue와 제어 흐름 효과가 다릅니다.",
  },
  {
    id: "flow-while-1",
    category: "제어문",
    kind: "단답형",
    question: "while 반복의 출력 결과는?",
    code: "n = 5\nresult = []\nwhile n > 0:\n    n -= 2\n    result.append(n)\nprint(result)",
    answer: "[3, 1, -1]",
    explanation:
      "조건은 각 반복 시작 전에 검사합니다. n이 1일 때 반복에 진입한 후 -1을 추가하고 다음 검사에서 종료됩니다.",
  },
  {
    id: "flow-enumerate",
    category: "제어문",
    kind: "단답형",
    question: "enumerate의 start 인자를 고려해 출력 결과를 작성하세요.",
    code: "for index, value in enumerate(['a', 'b'], start=1):\n    print(index, value)",
    answer: "1 a 2 b",
    explanation:
      "enumerate는 (인덱스, 값) 쌍을 만들며 start=1이면 인덱스가 1부터 시작합니다.",
  },
  {
    id: "flow-zip",
    category: "제어문",
    kind: "단답형",
    question: "길이가 다른 두 시퀀스를 zip한 결과는?",
    code: "print(list(zip([1, 2, 3], ['a', 'b'])))",
    answer: "[(1, 'a'), (2, 'b')]",
    explanation:
      "zip은 기본적으로 가장 짧은 iterable이 끝나는 시점에 종료됩니다.",
  },
  {
    id: "func-default-1",
    category: "함수·스코프",
    kind: "객관식",
    question: "기본 매개변수와 일반 매개변수의 올바른 정의 순서는?",
    choices: [
      "def func(a=1, b):",
      "def func(a, b=1):",
      "def func(*args, a, b):만 가능",
      "순서 제한이 없다",
    ],
    answer: "def func(a, b=1):",
    explanation:
      "기본값이 없는 매개변수는 기본값이 있는 매개변수보다 앞에 와야 합니다.",
  },
  {
    id: "func-args-1",
    category: "함수·스코프",
    kind: "단답형",
    question: "*args의 타입과 값을 고려해 출력 결과를 작성하세요.",
    code: "def collect(*args):\n    print(type(args).__name__, args)\ncollect(1, 2, 3)",
    answer: "tuple (1, 2, 3)",
    explanation:
      "여러 위치 인자는 함수 내부에서 args라는 튜플로 패킹됩니다.",
  },
  {
    id: "func-kwargs-1",
    category: "함수·스코프",
    kind: "단답형",
    question: "**kwargs의 타입을 작성하세요.",
    code: "def info(**kwargs):\n    print(type(kwargs).__name__)\ninfo(name='Kim', age=20)",
    answer: "dict",
    explanation:
      "여러 키워드 인자는 함수 내부에서 딕셔너리로 패킹됩니다.",
  },
  {
    id: "func-unpack-1",
    category: "함수·스코프",
    kind: "단답형",
    question: "시퀀스 언패킹의 출력 결과는?",
    code: "first, *middle, last = [1, 2, 3, 4, 5]\nprint(first, middle, last)",
    answer: "1 [2, 3, 4] 5",
    explanation:
      "별표가 붙은 변수는 남은 여러 요소를 리스트로 받습니다.",
  },
  {
    id: "func-lebg-1",
    category: "함수·스코프",
    kind: "객관식",
    question: "함수 내부에서 사용한 이름을 Python이 탐색하는 순서로 올바른 것은?",
    choices: [
      "Local → Enclosed → Global → Built-in",
      "Local → Global → Enclosed → Built-in",
      "Built-in → Global → Local → Enclosed",
      "Global → Local → Built-in → Enclosed",
    ],
    answer: "Local → Enclosed → Global → Built-in",
    explanation:
      "현재 지역, 바깥 함수, 전역, 내장 영역 순서로 이름을 탐색합니다.",
  },
  {
    id: "func-nonlocal",
    category: "함수·스코프",
    kind: "단답형",
    question: "nonlocal의 효과를 고려해 출력 결과를 작성하세요.",
    code: "def outer():\n    x = 1\n    def inner():\n        nonlocal x\n        x += 1\n    inner()\n    print(x)\nouter()",
    answer: "2",
    explanation:
      "nonlocal은 가장 가까운 바깥 함수 영역의 변수를 다시 바인딩하게 합니다.",
  },
  {
    id: "func-return-none",
    category: "함수·스코프",
    kind: "단답형",
    question: "명시적 return이 없는 함수의 반환값은?",
    code: "def greet():\n    message = 'hello'\n\nprint(greet())",
    answer: "None",
    explanation:
      "함수가 return을 만나지 않고 끝나면 None을 반환합니다.",
  },
  {
    id: "func-recursion",
    category: "함수·스코프",
    kind: "객관식",
    question: "재귀 함수에서 기저 조건(base case)이 필요한 이유는?",
    choices: [
      "무한 호출을 막고 재귀를 종료하기 위해",
      "전역 변수를 만들기 위해",
      "모든 반환값을 문자열로 바꾸기 위해",
      "함수 이름을 변경하기 위해",
    ],
    answer: "무한 호출을 막고 재귀를 종료하기 위해",
    explanation:
      "기저 조건이 없거나 도달할 수 없으면 RecursionError가 발생할 수 있습니다.",
  },
  {
    id: "func-map-lazy",
    category: "함수·스코프",
    kind: "객관식",
    question: "Python 3의 map 객체에 대한 설명으로 올바른 것은?",
    choices: [
      "필요할 때 값을 만드는 지연 평가 iterable이다",
      "항상 즉시 list를 반환한다",
      "한 번 순회한 후에도 무한히 같은 값을 제공한다",
      "함수 없이도 반드시 두 인자를 받는다",
    ],
    answer: "필요할 때 값을 만드는 지연 평가 iterable이다",
    explanation:
      "map 결과를 눈으로 확인하거나 재사용하려면 list로 변환할 수 있습니다. iterator는 소비될 수 있습니다.",
  },
  {
    id: "data-copy-1",
    category: "자료구조",
    kind: "단답형",
    question: "얕은 복사에서 중첩 리스트가 공유되는 결과를 작성하세요.",
    code: "a = [[1, 2], [3, 4]]\nb = a.copy()\nb[0].append(9)\nprint(a)",
    answer: "[[1, 2, 9], [3, 4]]",
    explanation:
      "바깥 리스트 b는 새 객체지만 내부 리스트는 a와 공유하므로 중첩 요소 변경이 원본에도 보입니다.",
  },
  {
    id: "data-alias-1",
    category: "자료구조",
    kind: "단답형",
    question: "할당과 복사의 차이를 고려해 출력 결과를 작성하세요.",
    code: "a = [1, 2]\nb = a\nb.append(3)\nprint(a is b, a)",
    answer: "True [1, 2, 3]",
    explanation:
      "b = a는 복사가 아니라 같은 리스트 객체를 가리키는 참조를 하나 더 만드는 할당입니다.",
  },
  {
    id: "data-extend",
    category: "자료구조",
    kind: "단답형",
    question: "append와 extend의 차이를 고려한 출력 결과는?",
    code: "a = [1]\na.append([2, 3])\nb = [1]\nb.extend([2, 3])\nprint(a, b)",
    answer: "[1, [2, 3]] [1, 2, 3]",
    explanation:
      "append는 인자를 하나의 요소로 추가하고 extend는 iterable의 각 요소를 이어 붙입니다.",
  },
  {
    id: "data-remove-pop",
    category: "자료구조",
    kind: "객관식",
    question: "list.remove와 list.pop의 차이로 올바른 것은?",
    choices: [
      "remove는 값을 삭제하고 pop은 인덱스의 값을 삭제하며 반환한다",
      "remove는 인덱스를 받고 pop은 값만 받는다",
      "둘 다 원본을 바꾸지 않는다",
      "둘 다 항상 None을 반환한다",
    ],
    answer: "remove는 값을 삭제하고 pop은 인덱스의 값을 삭제하며 반환한다",
    explanation:
      "remove(value)는 첫 번째 일치 값을 지우고 None을 반환합니다. pop(index)는 제거한 요소를 반환합니다.",
  },
  {
    id: "data-set-1",
    category: "자료구조",
    kind: "단답형",
    question: "세트의 중복 제거 성질을 이용한 출력 결과는?",
    code: "numbers = [1, 2, 2, 3, 3, 3]\nprint(len(set(numbers)))",
    answer: "3",
    explanation:
      "set은 중복 요소를 저장하지 않습니다. 단, 세트 자체는 순서를 보장하는 용도로 사용하면 안 됩니다.",
  },
  {
    id: "data-set-op",
    category: "자료구조",
    kind: "객관식",
    question: "집합 a와 b의 공통 원소를 구하는 연산자는?",
    choices: ["a & b", "a | b", "a - b", "a ^ b"],
    answer: "a & b",
    explanation:
      "&는 교집합, |는 합집합, -는 차집합, ^는 대칭 차집합입니다.",
  },
  {
    id: "data-hash-1",
    category: "자료구조",
    kind: "객관식",
    question: "딕셔너리 키로 사용할 수 없는 것은?",
    choices: ["'name'", "10", "(1, 2)", "[1, 2]"],
    answer: "[1, 2]",
    explanation:
      "딕셔너리 키는 해시 가능한 객체여야 합니다. 변경 가능한 list는 해시할 수 없습니다.",
  },
  {
    id: "data-dict-view",
    category: "자료구조",
    kind: "객관식",
    question: "딕셔너리의 키와 값을 동시에 순회하는 일반적인 표현은?",
    choices: ["for k, v in data.items():", "for k, v in data.keys():", "for k, v in data:", "for data in k, v:"],
    answer: "for k, v in data.items():",
    explanation:
      "items()는 (키, 값) 쌍을 제공하여 두 변수로 언패킹할 수 있습니다.",
  },
  {
    id: "data-get-bracket",
    category: "자료구조",
    kind: "객관식",
    question: "존재하지 않는 키를 조회할 때의 차이로 올바른 것은?",
    choices: [
      "data[key]는 KeyError, data.get(key)는 기본적으로 None",
      "둘 다 항상 KeyError",
      "둘 다 딕셔너리에 키를 자동 추가",
      "data.get(key)만 KeyError",
    ],
    answer: "data[key]는 KeyError, data.get(key)는 기본적으로 None",
    explanation:
      "get에 두 번째 인자를 주면 None 대신 원하는 기본값을 반환하게 할 수 있습니다.",
  },
  {
    id: "data-method-chain",
    category: "자료구조",
    kind: "단답형",
    question: "원본 변경 메서드의 반환값을 고려해 출력 결과를 작성하세요.",
    code: "numbers = [3, 1, 2]\nresult = numbers.copy().sort()\nprint(result)",
    answer: "None",
    explanation:
      "copy()는 새 리스트를 반환하지만 이어서 호출한 sort()는 그 리스트를 정렬한 뒤 None을 반환합니다.",
  },
  {
    id: "oop-class-instance",
    category: "OOP",
    kind: "단답형",
    question: "클래스 변수와 인스턴스 변수의 탐색 결과는?",
    code: "class Person:\n    species = 'human'\n\np1 = Person()\np2 = Person()\np1.species = 'developer'\nprint(p1.species, p2.species, Person.species)",
    answer: "developer human human",
    explanation:
      "p1에 같은 이름의 인스턴스 변수가 생겨 클래스 변수를 가립니다. p2는 여전히 클래스 변수를 찾습니다.",
  },
  {
    id: "oop-method-role",
    category: "OOP",
    kind: "객관식",
    question: "정적 메서드(static method)에 대한 설명으로 올바른 것은?",
    choices: [
      "self나 cls를 자동으로 받지 않으며 클래스와 관련된 독립 기능에 사용한다",
      "항상 인스턴스 상태를 변경해야 한다",
      "첫 매개변수로 반드시 cls를 받는다",
      "상속할 수 없는 메서드이다",
    ],
    answer: "self나 cls를 자동으로 받지 않으며 클래스와 관련된 독립 기능에 사용한다",
    explanation:
      "@staticmethod는 자동으로 전달되는 첫 인자가 없습니다. 인스턴스나 클래스 상태가 필요 없는 기능에 적합합니다.",
  },
  {
    id: "oop-init-return",
    category: "OOP",
    kind: "객관식",
    question: "__init__ 메서드에 대한 설명으로 올바른 것은?",
    choices: [
      "인스턴스 생성 과정에서 초기 상태를 설정하며 None 이외 값을 반환하면 안 된다",
      "클래스가 삭제될 때만 호출된다",
      "반드시 문자열을 반환해야 한다",
      "정적 메서드로만 작성해야 한다",
    ],
    answer: "인스턴스 생성 과정에서 초기 상태를 설정하며 None 이외 값을 반환하면 안 된다",
    explanation:
      "__init__은 생성된 인스턴스를 초기화합니다. 객체를 실제로 만드는 __new__와 역할이 다릅니다.",
  },
  {
    id: "oop-super-1",
    category: "OOP",
    kind: "단답형",
    question: "super()로 부모 초기화를 재사용한 출력 결과는?",
    code: "class Parent:\n    def __init__(self):\n        self.value = 10\n\nclass Child(Parent):\n    def __init__(self):\n        super().__init__()\n        self.value += 5\n\nprint(Child().value)",
    answer: "15",
    explanation:
      "super().__init__()이 부모의 초기화 코드를 실행한 후 자식에서 value를 변경합니다.",
  },
  {
    id: "oop-namespace",
    category: "OOP",
    kind: "객관식",
    question: "인스턴스에서 속성을 찾는 기본적인 순서로 가장 적절한 것은?",
    choices: [
      "인스턴스 → 클래스 → 부모 클래스",
      "부모 클래스 → 클래스 → 인스턴스",
      "클래스 → 전역 → 인스턴스",
      "내장 영역 → 인스턴스 → 클래스",
    ],
    answer: "인스턴스 → 클래스 → 부모 클래스",
    explanation:
      "인스턴스 자체에 없으면 클래스와 상속 계층의 MRO를 따라 속성을 찾습니다.",
  },
  {
    id: "oop-magic",
    category: "OOP",
    kind: "객관식",
    question: "print(instance)에서 사람이 읽을 문자열 표현을 제공하는 매직 메서드는?",
    choices: ["__str__", "__init__", "__len__", "__call__"],
    answer: "__str__",
    explanation:
      "__str__은 str()과 print()에서 사용할 읽기 좋은 문자열 표현을 반환합니다.",
  },
  {
    id: "except-else",
    category: "예외처리",
    kind: "객관식",
    question: "try-except의 else 블록은 언제 실행되는가?",
    choices: [
      "try에서 예외가 발생하지 않았을 때",
      "예외가 발생했을 때만",
      "finally가 실패했을 때",
      "항상 except보다 먼저",
    ],
    answer: "try에서 예외가 발생하지 않았을 때",
    explanation:
      "else에는 예외가 없을 때만 실행할 코드를 두고, finally는 예외 여부와 관계없이 실행합니다.",
  },
  {
    id: "except-order",
    category: "예외처리",
    kind: "객관식",
    question: "except Exception을 구체적인 예외보다 먼저 작성하면 생기는 문제는?",
    choices: [
      "뒤의 구체적인 except에 도달할 수 없다",
      "모든 예외가 자동으로 무시된다",
      "finally가 두 번 실행된다",
      "try 블록이 실행되지 않는다",
    ],
    answer: "뒤의 구체적인 except에 도달할 수 없다",
    explanation:
      "Exception이 하위 예외를 먼저 모두 잡으므로 ZeroDivisionError 같은 뒤쪽 분기가 사실상 도달 불가능해집니다.",
  },
  {
    id: "except-as",
    category: "예외처리",
    kind: "단답형",
    question: "발생하는 예외 클래스 이름을 작성하세요.",
    code: "try:\n    [1, 2][5]\nexcept Exception as error:\n    print(type(error).__name__)",
    answer: "IndexError",
    explanation:
      "리스트 범위를 벗어난 인덱스 접근은 IndexError를 발생시킵니다. as로 예외 객체를 받아 정보를 확인할 수 있습니다.",
  },
  {
    id: "except-eafp",
    category: "예외처리",
    kind: "객관식",
    question: "예외 처리를 중심으로 먼저 연산을 시도하는 코딩 방식을 설명한 것은?",
    choices: [
      "먼저 실행하고 문제가 생기면 예외를 처리한다",
      "모든 조건을 if로 미리 검사한 뒤 실행한다",
      "예외 처리를 절대 사용하지 않는다",
      "오류가 나면 프로그램을 항상 종료한다",
    ],
    answer: "먼저 실행하고 문제가 생기면 예외를 처리한다",
    explanation:
      "EAFP는 Easier to Ask Forgiveness than Permission의 약자로 try-except 중심 접근입니다. 미리 검사하는 방식은 LBYL입니다.",
  },
  {
    id: "except-multi",
    category: "예외처리",
    kind: "객관식",
    question: "하나의 except에서 여러 예외를 함께 처리하는 올바른 문법은?",
    choices: [
      "except (ValueError, TypeError):",
      "except ValueError or TypeError:",
      "except [ValueError, TypeError]:",
      "except ValueError, TypeError:",
    ],
    answer: "except (ValueError, TypeError):",
    explanation:
      "여러 예외 클래스는 튜플로 묶어 except 절에 작성합니다.",
  },
];

const generatedQuestions: Question[] = [
  ...[
    [31, 6],
  ].map(([a, b], index): Question => ({
    id: `generated-op-${index}`,
    category: "연산자·형변환",
    kind: "단답형",
    question: "연산자 우선순위를 적용한 출력 결과를 작성하세요.",
    code: `print(${a} // ${b} + ${a} % ${b} * 2)`,
    answer: String(Math.floor(a / b) + (a % b) * 2),
    explanation: `//와 %를 먼저 계산합니다. ${a} // ${b}는 ${Math.floor(a / b)}, 나머지는 ${a % b}이므로 결과는 ${Math.floor(a / b) + (a % b) * 2}입니다.`,
  })),
  ...[
    ["ssafycoding", 1, 2],
  ].map(([text, start, step], index): Question => {
    const value = String(text);
    const begin = Number(start);
    const gap = Number(step);
    return {
      id: `generated-slice-${index}`,
      category: "문자열·시퀀스",
      kind: "단답형",
      question: "슬라이싱 결과를 정확히 작성하세요.",
      code: `text = '${value}'\nprint(text[${begin}::${gap}])`,
      answer: [...value].filter((_, i) => i >= begin && (i - begin) % gap === 0).join(""),
      explanation: `인덱스 ${begin}부터 시작해 ${gap}칸 간격으로 끝까지 선택합니다.`,
    };
  }),
  ...[
    [10, 3],
  ].map(([end, divisor], index): Question => {
    const answer = Array.from({ length: end - 1 }, (_, i) => i + 1)
      .filter((value) => value % divisor !== 0)
      .reduce((sum, value) => sum + value, 0);
    return {
      id: `generated-loop-${index}`,
      category: "제어문",
      kind: "단답형",
      question: "continue가 적용된 반복문의 출력 결과는?",
      code: `total = 0\nfor i in range(1, ${end}):\n    if i % ${divisor} == 0:\n        continue\n    total += i\nprint(total)`,
      answer: String(answer),
      explanation: `${divisor}의 배수에서는 continue로 덧셈을 건너뛰고 나머지 값만 합산합니다.`,
    };
  }),
  ...[
    [[3, 4, 5, 8], 5],
  ].map(([rawValues, factor], index): Question => {
    const values = rawValues as number[];
    const multiplier = factor as number;
    const answer = values.filter((value) => value % 2 === 1).map((value) => value * multiplier);
    return {
      id: `generated-function-${index}`,
      category: "함수·스코프",
      kind: "단답형",
      question: "함수의 반환값을 리스트 형식 그대로 작성하세요.",
      code: `def transform(numbers, factor=${multiplier}):\n    return [number * factor for number in numbers if number % 2]\n\nprint(transform(${JSON.stringify(values)}))`,
      answer: JSON.stringify(answer).replaceAll(",", ", "),
      explanation: `홀수만 남긴 뒤 각각 ${multiplier}를 곱해 새 리스트로 반환합니다.`,
    };
  }),
  ...[
    ["python", "java", "python", "js", "python"],
  ].map((values, index): Question => {
    const target = values[0];
    const count = values.filter((value) => value === target).length;
    return {
      id: `generated-dict-${index}`,
      category: "자료구조",
      kind: "단답형",
      question: "딕셔너리 집계 후 출력되는 값을 작성하세요.",
      code: `counts = {}\nfor item in ${JSON.stringify(values)}:\n    counts[item] = counts.get(item, 0) + 1\nprint(counts['${target}'])`,
      answer: String(count),
      explanation: `get(item, 0)으로 기존 개수를 가져와 1씩 누적하므로 '${target}'은 ${count}회입니다.`,
    };
  }),
  ...[
    ["IndexError", "[1, 2][5]"],
  ].map(([error, expression], index): Question => ({
    id: `generated-exception-${index}`,
    category: "예외처리",
    kind: "단답형",
    question: "출력되는 예외 클래스 이름을 작성하세요.",
    code: `try:\n    ${expression}\nexcept Exception as error:\n    print(type(error).__name__)`,
    answer: error,
    explanation: `${expression} 표현식은 ${error}를 발생시킵니다.`,
  })),
  ...[
    ["Score", 10, 15],
  ].map(([name, parentValue, childValue], index): Question => ({
    id: `generated-oop-${index}`,
    category: "OOP",
    kind: "단답형",
    question: "자식 클래스의 속성 탐색 결과를 작성하세요.",
    code: `class Parent:\n    value = ${parentValue}\n\nclass ${name}(Parent):\n    value = ${childValue}\n\nprint(${name}().value)`,
    answer: String(childValue),
    explanation: `인스턴스에 해당 속성이 없으므로 자식 클래스에서 먼저 value를 찾아 ${childValue}를 출력합니다.`,
  })),
];

const examStyleQuestions: Question[] = [
  {
    id: "exam-dict-theory",
    category: "자료구조",
    kind: "객관식",
    question: "다음 중 딕셔너리에 대한 설명으로 옳지 않은 것은?",
    choices: [
      "시퀀스 자료형이다.",
      "키를 이용해 대응하는 값을 얻을 수 있다.",
      "하나의 딕셔너리에서 키는 중복될 수 없다.",
      "get으로 없는 키를 조회하고 기본값을 생략하면 None을 반환한다.",
    ],
    answer: "시퀀스 자료형이다.",
    explanation:
      "딕셔너리는 키-값 쌍으로 구성되는 비시퀀스 자료형입니다. 삽입 순서를 보존하는 것과 인덱스 순서로 접근하는 시퀀스라는 것은 다른 개념입니다.",
  },
  {
    id: "exam-nested-loop-matrix",
    category: "제어문",
    kind: "객관식",
    question: "다음 코드를 실행했을 때 출력되는 결과로 옳은 것은?",
    code: "numbers = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\n\nfor i in range(len(numbers)):\n    for j in range(len(numbers)):\n        print(numbers[j][i], end=' ')",
    choices: [
      "1 2 3 4 5 6 7 8 9",
      "1 2 3 6 9 8 7 5 4",
      "1 4 7 2 5 8 3 6 9",
      "9 8 7 6 5 4 3 2 1",
    ],
    answer: "1 4 7 2 5 8 3 6 9",
    explanation:
      "바깥 반복의 i가 열 인덱스를 고정하고 안쪽 반복의 j가 행을 이동합니다. 따라서 각 행을 읽는 것이 아니라 첫 번째 열, 두 번째 열, 세 번째 열 순서로 출력합니다.",
  },
  {
    id: "exam-animal-output",
    category: "OOP",
    kind: "단답형",
    question: "다음 코드를 실행했을 때 출력되는 결과만 정확히 작성하세요.",
    code: "class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def walk(self):\n        print('걷는다!')\n\n    def eat(self):\n        print(f'{self.name}!먹는다!')\n\ndog = Animal('dog')\ndog.walk()",
    answer: "걷는다!",
    explanation:
      "dog.walk()은 walk 메서드만 호출합니다. eat 메서드는 정의되어 있지만 호출되지 않으므로 이름을 포함한 문장은 출력되지 않습니다.",
  },
  {
    id: "exam-enumerate-blank",
    category: "제어문",
    kind: "단답형",
    question: "인덱스와 요소를 함께 순회하려고 합니다. (a)에 들어갈 함수 이름만 작성하세요. 괄호는 작성하지 않습니다.",
    code: "lunch = ['짜장면', '짬뽕', '탕수육']\n\nfor idx, menu in (a)(lunch):\n    print(idx, menu)",
    answer: "enumerate",
    explanation:
      "enumerate(iterable)는 각 요소와 함께 0부터 시작하는 인덱스를 제공하므로 두 변수로 언패킹할 수 있습니다. 문제에서 괄호를 제외하라고 했으므로 함수 이름만 작성해야 합니다.",
  },
  {
    id: "exam-sequence-essay",
    category: "문자열·시퀀스",
    kind: "서술형",
    question: "시퀀스형 데이터의 공통 특징과 종류를 비시퀀스형 데이터와 구분하여 100자 이상으로 서술하세요.",
    answer:
      "시퀀스형 데이터는 여러 값을 정해진 순서로 저장하여 인덱싱, 슬라이싱, 길이 확인과 같은 공통 연산을 적용할 수 있다. 문자열, 리스트, 튜플, range가 대표적인 시퀀스형이다. 순서가 있다는 말은 자동으로 정렬되어 있다는 뜻이 아니다. 딕셔너리는 키로 값을 조회하고 집합은 중복 없는 원소를 다루므로 둘 다 비시퀀스형이다.",
    explanation:
      "핵심은 순서 보장과 정렬을 구분하고, 시퀀스의 공통 연산과 대표 자료형을 제시하며, 딕셔너리와 집합을 시퀀스에 포함하지 않는 것입니다.",
  },
  {
    id: "exam-comprehension-error-essay",
    category: "제어문",
    kind: "서술형",
    question: "다음 코드의 실행 결과와 그 이유를 100자 이상으로 서술하세요. 오류가 발생한다면 오류 종류와 발생 원인을 모두 포함하세요.",
    code: "documents = ['java', 'python', 's5g4', 's5g2', 'spring', 'django', 'extra']\npython_class = [documents[i + 1] for i in range(0, len(documents), 2)]\n\nprint(python_class)",
    answer:
      "리스트 컴프리헨션을 계산하는 도중 IndexError가 발생하므로 print 문은 실행되지 않는다. range(0, 7, 2)는 0, 2, 4, 6을 만들고 각 값에 1을 더해 documents[1], documents[3], documents[5], documents[7]에 접근한다. 마지막 documents[7]은 길이가 7인 리스트의 유효 인덱스 0부터 6을 벗어나기 때문에 오류가 발생한다.",
    explanation:
      "오류 이름만 쓰는 것으로는 부족합니다. range가 만드는 마지막 값, i + 1의 결과, 리스트의 유효 인덱스 범위, print가 실행되지 않는다는 점까지 연결해야 합니다.",
  },
  {
    id: "exam-dict-access-error",
    category: "자료구조",
    kind: "객관식",
    question: "빈 딕셔너리 data에서 없는 키 'score'를 조회할 때의 설명으로 옳은 것은?",
    code: "data = {}",
    choices: [
      "data['score']와 data.get('score') 모두 None을 반환한다.",
      "data['score']는 KeyError가 발생하고 data.get('score')는 None을 반환한다.",
      "data['score']는 None을 반환하고 data.get('score')는 KeyError가 발생한다.",
      "두 표현 모두 빈 문자열을 반환한다.",
    ],
    answer: "data['score']는 KeyError가 발생하고 data.get('score')는 None을 반환한다.",
    explanation:
      "대괄호 조회는 키가 반드시 존재해야 하므로 KeyError가 발생합니다. get은 키가 없을 때 예외 대신 지정한 기본값을 반환하며, 기본값을 생략하면 None입니다.",
  },
  {
    id: "exam-args-blank",
    category: "함수·스코프",
    kind: "단답형",
    question: "여러 개의 위치 인자를 하나의 튜플로 받으려 합니다. (a)에 들어갈 매개변수 표현을 정확히 작성하세요.",
    code: "def total((a)):\n    return sum(numbers)\n\nprint(total(1, 2, 3))",
    answer: "*numbers",
    explanation:
      "매개변수 이름 앞의 별표 하나는 전달된 여러 위치 인자를 튜플로 패킹합니다. 별표를 생략하면 여러 인자를 하나의 매개변수로 받을 수 없습니다.",
  },
  {
    id: "exam-zip-blank",
    category: "제어문",
    kind: "단답형",
    question: "두 리스트의 같은 위치 요소를 짝지어 순회하려 합니다. (a)에 들어갈 함수 이름만 작성하세요.",
    code: "names = ['Alice', 'Bob']\nscores = [90, 80]\n\nfor name, score in (a)(names, scores):\n    print(name, score)",
    answer: "zip",
    explanation:
      "zip은 여러 반복 가능한 객체에서 같은 위치의 요소를 튜플로 묶어 제공합니다. 여기서는 각 튜플이 name과 score로 언패킹됩니다.",
  },
  {
    id: "exam-class-instance-trace",
    category: "OOP",
    kind: "단답형",
    question: "다음 코드가 출력하는 두 숫자를 공백으로 구분해 정확히 작성하세요.",
    code: "class Student:\n    count = 0\n\n    def __init__(self):\n        Student.count += 1\n        self.count = 10\n\na = Student()\nb = Student()\nprint(Student.count, a.count)",
    answer: "2 10",
    explanation:
      "생성자가 두 번 호출되어 클래스 변수 Student.count는 2가 됩니다. a.count는 a 인스턴스에 직접 저장된 인스턴스 변수 10을 먼저 찾습니다.",
  },
  {
    id: "exam-try-else-finally",
    category: "예외처리",
    kind: "객관식",
    question: "다음 코드의 출력 순서로 옳은 것은?",
    code: "try:\n    value = int('10')\nexcept ValueError:\n    print('except')\nelse:\n    print('else')\nfinally:\n    print('finally')",
    choices: ["except", "else", "finally", "else finally"],
    answer: "else finally",
    explanation:
      "int('10')은 정상적으로 10을 반환하므로 except는 실행되지 않고 else가 실행됩니다. finally는 예외 발생 여부와 관계없이 마지막에 실행됩니다.",
  },
  {
    id: "exam-shallow-copy-trace",
    category: "자료구조",
    kind: "객관식",
    question: "다음 코드의 출력 결과로 옳은 것은?",
    code: "original = [[1, 2], [3, 4]]\ncopied = original[:]\ncopied[0].append(9)\nprint(original)",
    choices: [
      "[[1, 2], [3, 4]]",
      "[[1, 2, 9], [3, 4]]",
      "[[1, 2], [3, 4], 9]",
      "오류가 발생한다.",
    ],
    answer: "[[1, 2, 9], [3, 4]]",
    explanation:
      "슬라이싱은 바깥 리스트만 새로 만들고 내부 리스트 객체는 공유합니다. copied[0]과 original[0]이 같은 내부 리스트를 가리키므로 append의 변경이 original에서도 보입니다.",
  },
  {
    id: "exam-short-circuit-side-effect",
    category: "연산자·형변환",
    kind: "단답형",
    question: "다음 코드가 실제로 출력하는 내용을 순서대로 작성하세요.",
    code: "def check():\n    print('호출')\n    return False\n\nprint(True or check())\nprint(False or check())",
    answer: "True 호출 False",
    explanation:
      "첫 번째 or는 왼쪽 True만으로 결과가 결정되어 check를 호출하지 않습니다. 두 번째 or는 왼쪽이 False이므로 check를 호출해 '호출'을 출력하고, 반환값 False가 바깥 print로 출력됩니다.",
  },
];

const verifiedFundamentalQuestions: Question[] = [
  {
    id: "verified-return-tuple",
    category: "함수·스코프",
    kind: "객관식",
    question: "다음 함수의 반환값과 타입을 올바르게 설명한 것은?",
    code: "def get_user():\n    return 'Alice', 30",
    choices: [
      "두 값을 각각 따로 반환한다",
      "('Alice', 30)이라는 하나의 튜플을 반환한다",
      "['Alice', 30]이라는 리스트를 반환한다",
      "마지막 값 30만 반환한다",
    ],
    answer: "('Alice', 30)이라는 하나의 튜플을 반환한다",
    explanation:
      "Python 함수는 호출 한 번에 하나의 객체를 반환합니다. return 뒤에 값을 쉼표로 나열하면 Python이 그 값들을 튜플로 패킹하므로 실제 반환값은 ('Alice', 30) 하나입니다. 호출 측에서 name, age = get_user()처럼 받으면 이 튜플이 다시 언패킹됩니다.",
  },
  {
    id: "verified-return-single-tuple",
    category: "함수·스코프",
    kind: "단답형",
    question: "다음 함수가 반환하는 값을 Python 표현식 그대로 작성하세요.",
    code: "def wrap(value):\n    return value,\n\nprint(wrap(7))",
    answer: "(7,)",
    explanation:
      "튜플을 만드는 핵심 문법은 괄호가 아니라 쉼표입니다. return value,는 return (value,)와 같으므로 요소가 하나인 튜플 (7,)을 반환합니다. (7)은 괄호로 정수 표현식을 묶은 것일 뿐 튜플이 아닙니다.",
  },
  {
    id: "verified-tuple-packing",
    category: "문자열·시퀀스",
    kind: "단답형",
    question: "괄호가 생략된 튜플 패킹의 출력 결과를 작성하세요.",
    code: "data = 1, 'hello', 3.14\nprint(type(data).__name__, data)",
    answer: "tuple (1, 'hello', 3.14)",
    explanation:
      "쉼표로 여러 값을 나열하면 소괄호를 생략해도 튜플로 패킹됩니다. 따라서 data는 세 값을 가진 tuple 객체입니다. 괄호는 가독성을 높이지만 일반적인 튜플 생성에서 필수 조건은 아닙니다.",
  },
  {
    id: "verified-empty-set",
    category: "자료구조",
    kind: "객관식",
    question: "빈 세트를 생성하는 올바른 표현은?",
    choices: ["{}", "set()", "[]", "()"],
    answer: "set()",
    explanation:
      "{}는 빈 딕셔너리를 나타내는 문법으로 이미 사용됩니다. 따라서 빈 세트는 반드시 set()으로 생성해야 합니다. 내용이 있는 세트는 {1, 2}처럼 중괄호 표기를 사용할 수 있습니다.",
  },
  {
    id: "verified-set-remove-discard",
    category: "자료구조",
    kind: "객관식",
    question: "세트에 존재하지 않는 값을 삭제하려 할 때 예외를 발생시키지 않는 메서드는?",
    choices: ["remove", "discard", "pop", "clear"],
    answer: "discard",
    explanation:
      "remove(value)는 대상이 없으면 KeyError를 발생시키지만 discard(value)는 대상이 없어도 아무 작업 없이 종료합니다. 값의 존재가 보장되지 않는 상황에서는 discard가 안전하며, 오류를 통해 잘못된 상태를 발견해야 한다면 remove가 더 적절할 수 있습니다.",
  },
  {
    id: "verified-keyword-order",
    category: "함수·스코프",
    kind: "객관식",
    question: "다음 함수 호출 중 문법 오류가 발생하는 것은?",
    code: "def greet(name, age):\n    pass",
    choices: [
      "greet('Kim', 20)",
      "greet(name='Kim', age=20)",
      "greet(age=20, name='Kim')",
      "greet(age=20, 'Kim')",
    ],
    answer: "greet(age=20, 'Kim')",
    explanation:
      "호출에서 위치 인자는 키워드 인자보다 앞에 와야 합니다. 키워드로 age를 지정한 뒤 위치 인자 'Kim'을 쓰면 어느 매개변수에 대응하는지 문법적으로 허용되지 않습니다. 키워드 인자끼리는 정의 순서와 다르게 작성할 수 있습니다.",
  },
  {
    id: "verified-builtin-shadow",
    category: "함수·스코프",
    kind: "단답형",
    question: "마지막 줄을 실행할 때 발생하는 예외 클래스 이름을 작성하세요.",
    code: "print(sum([1, 2, 3]))\nsum = 5\nprint(sum([1, 2, 3]))",
    answer: "TypeError",
    explanation:
      "sum = 5를 실행하면 현재 전역 이름 sum이 내장 함수가 아니라 정수 5를 가리키게 됩니다. 마지막 줄은 정수 객체를 함수처럼 호출하려 하므로 TypeError가 발생합니다. list, str, id, type 같은 내장 이름도 변수명으로 덮어쓰지 않도록 주의해야 합니다.",
  },
  {
    id: "verified-setdefault",
    category: "자료구조",
    kind: "단답형",
    question: "다음 코드가 출력하는 딕셔너리를 작성하세요.",
    code: "data = {'name': 'Alice'}\ndata.setdefault('country', 'KOREA')\nprint(data)",
    answer: "{'name': 'Alice', 'country': 'KOREA'}",
    explanation:
      "setdefault(key, default)는 키가 없으면 기본값을 딕셔너리에 실제로 추가한 뒤 그 값을 반환합니다. 키가 이미 있으면 기존 값을 반환하며 덮어쓰지 않습니다. 값을 조회만 하는 get과 달리 원본 딕셔너리를 변경할 수 있다는 점이 핵심입니다.",
  },
  {
    id: "verified-dict-update",
    category: "자료구조",
    kind: "단답형",
    question: "update 실행 후 딕셔너리의 값을 작성하세요.",
    code: "data = {'name': 'Alice', 'age': 20}\ndata.update({'name': 'Jane', 'city': 'Seoul'})\nprint(data)",
    answer: "{'name': 'Jane', 'age': 20, 'city': 'Seoul'}",
    explanation:
      "update는 전달된 키가 원본에 있으면 값을 덮어쓰고, 없으면 새 키·값 쌍을 추가합니다. name은 Jane으로 변경되고 age는 유지되며 city가 추가됩니다. 메서드는 원본 딕셔너리를 변경하고 None을 반환합니다.",
  },
  {
    id: "verified-dict-pop",
    category: "자료구조",
    kind: "단답형",
    question: "두 print가 출력하는 값을 순서대로 작성하세요.",
    code: "data = {'name': 'Alice', 'age': 25}\nprint(data.pop('age'))\nprint(data)",
    answer: "25 {'name': 'Alice'}",
    explanation:
      "딕셔너리 pop(key)은 해당 키·값 쌍을 원본에서 제거하면서 제거된 값을 반환합니다. 따라서 첫 출력은 25이고 이후 딕셔너리에는 name만 남습니다. 없는 키에 기본값을 주지 않으면 KeyError가 발생합니다.",
  },
  {
    id: "verified-numeric-methods",
    category: "문자열·시퀀스",
    kind: "객관식",
    question: "문자열의 숫자 판별 범위를 좁은 것부터 넓은 것 순서로 올바르게 나열한 것은?",
    choices: [
      "isdecimal() → isdigit() → isnumeric()",
      "isnumeric() → isdigit() → isdecimal()",
      "isdigit() → isdecimal() → isnumeric()",
      "세 메서드의 판정 범위는 완전히 같다",
    ],
    answer: "isdecimal() → isdigit() → isnumeric()",
    explanation:
      "isdecimal은 0~9와 같은 십진수 문자 중심으로 가장 엄격하게 판정합니다. isdigit은 위첨자처럼 숫자 모양으로 취급되는 일부 문자를 더 포함하고, isnumeric은 분수·한자 숫자 등 수치 의미를 가진 문자까지 가장 넓게 포함합니다.",
  },
  {
    id: "verified-int-string-float",
    category: "연산자·형변환",
    kind: "객관식",
    question: "다음 중 ValueError가 발생하는 표현식은?",
    choices: ["int('3')", "float('3.5')", "int(3.5)", "int('3.5')"],
    answer: "int('3.5')",
    explanation:
      "int는 정수 형식의 문자열은 변환할 수 있지만 소수점이 포함된 문자열 '3.5'를 직접 정수로 해석하지 못합니다. int(3.5)는 이미 float인 값을 받아 소수점 아래를 버리고 3을 반환합니다. 문자열 실수는 먼저 float('3.5')로 변환할 수 있습니다.",
  },
];

const questionPolish: Record<string, Partial<Question>> = {
  "op-1": {
    question: "다음 표현식을 Python의 연산자 우선순위에 따라 계산한 결과는?",
    explanation:
      "판단 과정: 정수 나눗셈(//)과 나머지(%)는 덧셈보다 우선하므로 각각 17 // 4 = 4, 17 % 4 = 1을 먼저 구합니다. 그다음 곱셈을 적용하면 1 × 2 = 2이고, 마지막으로 4 + 2를 계산해 6이 됩니다. 식을 왼쪽부터 무조건 계산하는 것이 아니라 우선순위별로 묶어 추적해야 합니다.",
  },
  "op-2": {
    question: "다음 코드가 출력하는 값을 고르세요.",
    explanation:
      "판단 과정: 빈 문자열은 불리언 문맥에서 False로 평가됩니다. or는 왼쪽 피연산자가 falsy이면 오른쪽 피연산자를 평가하고 그 값을 그대로 반환하므로 결과는 문자열 'Python'입니다. and와 or가 항상 True 또는 False를 반환한다고 생각하기 쉬우나, Python에서는 결과를 결정한 피연산자 자체를 반환합니다.",
  },
  "op-is-1": {
    question: "두 객체를 비교하는 방법에 관한 설명으로 가장 정확한 것은?",
    explanation:
      "==는 두 객체가 표현하는 값이 같은지 확인하고, is는 두 변수가 완전히 동일한 객체를 가리키는지 확인합니다. 값 비교에는 일반적으로 ==를 사용합니다. None처럼 프로그램에서 하나만 존재하는 싱글턴 객체를 확인할 때는 is None을 사용하는 것이 수업자료의 권장 방식입니다.",
  },
  "op-is-2": {
    explanation:
      "a와 b는 내용이 [1, 2]로 같기 때문에 a == b는 True입니다. 하지만 각각 별도로 생성된 리스트이므로 a is b는 False입니다. c = a는 새로운 리스트를 복사한 것이 아니라 a의 참조를 c에 할당한 것이므로 a is c는 True입니다.",
  },
  "op-short-2": {
    question: "다음 코드를 실행했을 때 실제로 출력되는 내용을 작성하세요.",
    explanation:
      "and는 왼쪽 값이 falsy이면 오른쪽을 평가하지 않습니다. 따라서 check()는 호출되지 않아 '실행'은 출력되지 않고, False and ... 표현식의 결과인 False만 print에 전달됩니다. 함수 호출이나 연산이 생략될 수 있다는 점이 단락 평가의 핵심입니다.",
  },
  "op-short-3": {
    question: "다음 표현식 중 오른쪽의 check() 함수가 실제로 호출되는 것은?",
    explanation:
      "and는 왼쪽이 truthy일 때만 오른쪽 값을 확인해야 결과를 결정할 수 있습니다. 따라서 True and check()에서만 check()가 호출됩니다. 반대로 or는 왼쪽이 truthy이면 이미 전체 결과가 결정되므로 오른쪽을 실행하지 않습니다.",
  },
  "op-float-1": {
    question: "다음 비교가 예상과 다르게 False가 될 수 있는 원인으로 가장 정확한 것은?\n0.1 + 0.2 == 0.3",
    explanation:
      "컴퓨터는 실수를 제한된 비트의 이진 부동소수점으로 저장합니다. 0.1이나 0.2처럼 이진수로 정확히 끝나지 않는 값은 가장 가까운 값으로 근사되므로 연산 뒤 미세한 오차가 남을 수 있습니다. 수업자료에서는 정확한 10진 연산이 필요할 때 문자열을 Decimal에 전달하는 방법을 제시합니다.",
  },
  "seq-2": {
    question: "다음 중 실행 중에 내부 상태를 직접 변경할 수 있는 객체만 묶인 것은?",
    explanation:
      "list, dict, set은 생성된 객체의 내용을 그대로 둔 채 요소를 추가·삭제·교체할 수 있는 가변 객체입니다. str, tuple, range는 불변 객체이므로 변경처럼 보이는 연산을 수행하면 기존 객체가 바뀌는 것이 아니라 새 객체가 만들어집니다. 복사와 함수 인자 동작을 이해할 때 이 구분이 중요합니다.",
  },
  "seq-slice-copy": {
    question: "중첩 리스트 a에 대해 b = a[:]를 실행했을 때 b의 상태를 가장 정확히 설명한 것은?",
    explanation:
      "a[:]는 바깥 리스트만 새로 생성하는 얕은 복사입니다. 따라서 a is b는 False지만, 두 리스트 안에 들어 있던 중첩 리스트 객체는 그대로 공유됩니다. 내부 리스트를 수정하면 양쪽에서 변화가 보일 수 있으며, 중첩 객체까지 분리하려면 copy.deepcopy()를 검토해야 합니다.",
  },
  "flow-break-else": {
    question: "다음 코드를 실행했을 때 출력되는 내용을 작성하세요.",
    explanation:
      "for문의 else는 반복문이 break로 중단되지 않고 정상적으로 끝났을 때 실행됩니다. 목록에는 짝수가 없어 break가 한 번도 실행되지 않으므로 반복이 끝난 뒤 '완료'가 출력됩니다. else가 단순히 if와 짝을 이루는 것이 아니라 반복문의 정상 종료 여부와 연결된다는 점이 핵심입니다.",
  },
  "func-1": {
    question: "다음 코드가 순서대로 출력하는 두 값을 작성하세요.",
    explanation:
      "change 함수 안의 number = 25는 새로운 지역 변수를 만듭니다. 함수 내부에서는 가장 가까운 지역 이름을 찾아 25를 출력하지만, global 선언이 없으므로 전역 number에는 대입이 일어나지 않습니다. 함수 호출이 끝난 후 전역 number는 여전히 10입니다.",
  },
  "func-default-1": {
    question: "다음 중 SyntaxError 없이 정의할 수 있는 함수 선언은?",
    explanation:
      "위치 매개변수에서 기본값이 없는 매개변수는 기본값이 있는 매개변수보다 앞에 배치해야 합니다. 호출 시 어느 값이 어느 매개변수에 대응하는지 모호해지는 것을 막기 위한 문법 규칙입니다. 따라서 def func(a, b=1): 형태가 올바릅니다.",
  },
  "func-lebg-1": {
    question: "함수 내부에서 사용한 이름이 현재 지역에 없을 때 Python이 탐색하는 순서로 올바른 것은?",
    explanation:
      "Python은 먼저 현재 함수의 Local 영역을 확인하고, 중첩 함수라면 바깥 함수의 Enclosed 영역을 찾습니다. 이후 모듈 수준의 Global 영역, 마지막으로 len이나 print가 있는 Built-in 영역을 탐색합니다. 이 Local → Enclosed → Global → Built-in 순서의 머리글자를 LEGB라고 부릅니다.",
  },
  "func-nonlocal": {
    question: "다음 코드의 출력 결과를 작성하세요.",
    explanation:
      "inner의 x += 1은 값을 읽는 동시에 다시 대입하는 연산입니다. nonlocal x가 있으므로 새 지역 변수를 만드는 대신 가장 가까운 바깥 함수 outer의 x를 수정합니다. 전역 변수를 대상으로 하는 global과 적용 범위가 다릅니다.",
  },
  "func-map-lazy": {
    question: "Python 3에서 map()이 반환하는 객체의 동작을 가장 정확히 설명한 것은?",
    explanation:
      "map은 입력 전체를 즉시 계산한 리스트가 아니라, 다음 값이 요청될 때 함수를 적용하는 iterator를 반환합니다. 이런 지연 평가는 불필요한 계산과 메모리 사용을 줄일 수 있지만 한 번 소비한 iterator를 다시 순회하면 값이 남아 있지 않을 수 있습니다. 여러 번 사용할 결과라면 list(map(...))처럼 명시적으로 저장할 수 있습니다.",
  },
  "data-1": {
    question: "다음 코드에서 result와 numbers에 저장된 값을 순서대로 작성하세요.",
    explanation:
      "append(2)는 numbers 객체 자체에 요소를 추가하는 원본 변경 메서드입니다. 이 메서드의 목적은 리스트 변경이므로 별도의 결과 리스트를 반환하지 않고 None을 반환합니다. 따라서 result는 None이고 numbers는 [3, 1, 4, 2]가 됩니다.",
  },
  "data-2": {
    question: "원본 리스트는 유지하면서 정렬된 새 리스트를 얻는 표현식은?",
    explanation:
      "sorted(numbers)는 전달받은 iterable을 기준으로 정렬된 새 리스트를 반환하며 원본 리스트를 변경하지 않습니다. 반면 numbers.sort()는 해당 리스트 자체를 정렬하고 None을 반환합니다. 원본 보존 여부와 반환값을 함께 구분해야 합니다.",
  },
  "data-copy-1": {
    question: "다음 코드를 실행한 뒤 원본 a의 값을 작성하세요.",
    explanation:
      "a.copy()는 바깥 리스트만 복사하므로 a와 b는 서로 다른 최상위 리스트입니다. 하지만 첫 번째 요소인 내부 리스트 [1, 2]는 두 리스트가 동일한 객체를 공유합니다. b[0].append(9)는 공유된 내부 객체를 변경하므로 a에서도 9가 추가된 결과가 관찰됩니다.",
  },
  "data-method-chain": {
    question: "다음 코드에서 result에 저장되는 값을 작성하세요.",
    explanation:
      "numbers.copy()는 새로운 리스트를 반환하므로 그 객체에서 sort()가 호출됩니다. sort()는 복사된 리스트를 정상적으로 정렬하지만 반환값은 None입니다. 메서드 체이닝에서는 각 메서드가 무엇을 반환하는지 확인해야 하며, 원본이 바뀌었는지와 result에 무엇이 들어가는지는 별개의 문제입니다.",
  },
  "data-hash-1": {
    question: "다음 중 딕셔너리의 키로 직접 사용할 수 없는 객체는?",
    explanation:
      "딕셔너리 키는 저장된 동안 해시값이 변하지 않는 hashable 객체여야 합니다. list는 내용을 변경할 수 있어 해시값을 안정적으로 유지할 수 없으므로 키로 사용할 수 없습니다. 문자열, 정수, 그리고 해시 가능한 요소로만 구성된 튜플은 키로 사용할 수 있습니다.",
  },
  "oop-1": {
    question: "클래스 자체의 상태를 사용하도록 정의한 메서드의 선언 방식으로 올바른 것은?",
    explanation:
      "클래스 메서드는 @classmethod 데코레이터를 붙이고 첫 번째 인자로 호출 대상 클래스를 받습니다. 이 인자는 관례상 cls라고 작성하며, 클래스 변수 접근이나 대체 생성자 구현에 활용됩니다. self를 받는 인스턴스 메서드, 자동 인자가 없는 정적 메서드와 구분해야 합니다.",
  },
  "oop-method-role": {
    question: "인스턴스나 클래스의 상태를 자동으로 전달받지 않는 메서드에 대한 설명으로 올바른 것은?",
    explanation:
      "@staticmethod로 정의한 메서드는 호출 시 self나 cls를 자동으로 받지 않습니다. 클래스의 주제와 관련은 있지만 인스턴스·클래스 상태가 필요 없는 검증이나 계산 기능을 묶을 때 사용할 수 있습니다. 단순히 '일반 함수와 완전히 다르다'기보다 클래스 네임스페이스 안에 관련 기능을 배치한다는 의미가 큽니다.",
  },
  "oop-3": {
    question: "다중 상속에서 메서드와 super()의 다음 호출 대상을 결정하는 기준은?",
    explanation:
      "Python은 클래스마다 Method Resolution Order, 즉 MRO라는 일관된 탐색 순서를 계산합니다. super()는 단순히 코드에 적힌 '직계 부모 하나'를 가리키는 것이 아니라 현재 클래스 다음의 MRO 항목으로 호출을 위임합니다. 다중 상속에서 모든 클래스가 협력적으로 super()를 사용해야 초기화 사슬이 끊기지 않습니다.",
  },
  "except-1": {
    question: "다음 코드가 순서대로 출력하는 두 문구를 작성하세요.",
    explanation:
      "int('3.5')는 소수점이 포함된 문자열을 정수 리터럴로 해석할 수 없어 ValueError를 발생시킵니다. 해당 except가 예외를 처리해 '변환 오류'를 출력하고, finally는 정상 실행 여부와 관계없이 이어서 '종료'를 출력합니다. 예외가 처리되더라도 finally는 생략되지 않습니다.",
  },
  "except-order": {
    question: "여러 except 절에서 상위 예외 클래스를 먼저 작성했을 때 발생하는 문제는?",
    explanation:
      "ZeroDivisionError와 ValueError 등 대부분의 일반 예외는 Exception의 하위 클래스입니다. except Exception을 먼저 두면 이 예외들이 모두 그 절에서 처리되어 뒤의 구체적인 except에는 도달할 수 없습니다. 따라서 구체적인 예외부터 넓은 예외 순으로 작성해야 상황별 처리가 가능합니다.",
  },
  "except-eafp": {
    question: "예외 처리를 중심으로 먼저 연산을 시도하는 Python의 일반적 코딩 방식을 설명한 것은?",
    explanation:
      "EAFP는 먼저 원하는 연산을 실행하고 실패했을 때 발생한 예외를 처리하는 접근입니다. 반대로 LBYL은 실행 전에 조건을 검사합니다. 파일·딕셔너리 접근처럼 검사와 실제 실행 사이에 상태가 달라질 수 있는 상황에서는 EAFP가 더 간결하고 안전할 수 있지만, 예외를 정상 흐름 제어에 과도하게 사용하는 것은 피해야 합니다.",
  },
};

const basicIds = new Set([
  "op-3", "op-truthy-1", "seq-1", "seq-2", "seq-tuple-1", "seq-range-1",
  "flow-2", "flow-pass-1", "func-2", "func-default-1", "func-return-none",
  "data-1", "data-2", "data-set-1", "data-dict-view", "oop-1", "except-3",
  "verified-return-tuple", "verified-return-single-tuple", "verified-tuple-packing",
  "verified-empty-set", "verified-set-remove-discard", "verified-keyword-order",
  "verified-builtin-shadow", "verified-setdefault", "verified-dict-update",
  "verified-dict-pop", "verified-numeric-methods", "verified-int-string-float",
  "exam-animal-output", "exam-enumerate-blank", "exam-zip-blank",
]);
const hardIds = new Set([
  "op-is-2", "op-float-1", "seq-slice-copy", "flow-break-else", "func-lebg-1",
  "func-map-lazy", "data-copy-1", "data-method-chain", "data-hash-1", "oop-3",
  "except-order", "except-eafp",
  "exam-sequence-essay", "exam-comprehension-error-essay", "exam-shallow-copy-trace",
]);
const thinkingIds = new Set([
  "op-short-2", "op-short-3", "op-membership-1", "flow-3", "flow-while-1",
  "func-1", "func-unpack-1", "func-recursion", "data-alias-1", "data-extend",
  "oop-2", "oop-class-instance", "oop-namespace", "except-1", "except-else",
  "exam-nested-loop-matrix", "exam-dict-access-error", "exam-args-blank",
  "exam-class-instance-trace", "exam-try-else-finally", "exam-short-circuit-side-effect",
]);

const unsupportedIds = new Set(["op-chain-1", "func-nonlocal", "oop-init-return"]);
const rawQuestionBank = [
  ...baseQuestions,
  ...conceptQuestions,
  ...generatedQuestions,
  ...examStyleQuestions,
  ...verifiedFundamentalQuestions,
].filter((question) => !unsupportedIds.has(question.id));

const questionBank = rawQuestionBank.map((question) => ({
  ...question,
  ...questionPolish[question.id],
  difficulty: basicIds.has(question.id)
    ? "기초" as const
    : hardIds.has(question.id)
      ? "고난도" as const
      : thinkingIds.has(question.id)
        ? "사고형" as const
        : "핵심" as const,
}));

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function checkAnswer(question: Question, answer: string) {
  if (question.kind === "서술형") return false;
  if (question.kind === "객관식") return answer === question.answer;
  return checkShortAnswer(question.answer, answer);
}

function formatTime(seconds: number) {
  const minute = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const second = (seconds % 60).toString().padStart(2, "0");
  return `${minute}:${second}`;
}

export default function Home() {
  const [view, setView] = useState<"home" | "exam" | "result">("home");
  const [selected, setSelected] = useState<Category[]>(categories);
  const [count, setCount] = useState<QuestionCount>(20);
  const [minutes, setMinutes] = useState<TimeLimit>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState<number | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("py-ready-history");
    setHistory(saved ? JSON.parse(saved) : []);
    const savedBookmarks = localStorage.getItem("py-ready-bookmarks");
    setMarked(savedBookmarks ? JSON.parse(savedBookmarks) : []);
    const savedWrong = localStorage.getItem("py-ready-wrong");
    setWrongIds(savedWrong ? JSON.parse(savedWrong) : []);
  }, []);

  useEffect(() => {
    if (view !== "exam" || submitted || seconds === null) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value === null) return null;
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => submitExam(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view, submitted, seconds === null]);

  const results = useMemo(
    () =>
      questions.map((question) => ({
        question,
        graded: question.kind !== "서술형",
        correct:
          question.kind !== "서술형" &&
          checkAnswer(question, answers[question.id] ?? ""),
      })),
    [questions, answers],
  );
  const gradedResults = results.filter((item) => item.graded);
  const score = gradedResults.filter((item) => item.correct).length;

  function startExam(targetQuestions?: Question[]) {
    const available = questionBank.filter((q) => selected.includes(q.category));
    const requestedCount = count === "all" ? available.length : count;
    let next: Question[];
    if (targetQuestions) {
      const targetCount = count === "all" ? targetQuestions.length : count;
      next = shuffle(targetQuestions).slice(0, Math.min(targetCount, targetQuestions.length));
    } else {
      const grouped = selected.map((category) => ({
        category,
        questions: shuffle(available.filter((q) => q.category === category)),
      }));
      next = [];
      while (next.length < Math.min(requestedCount, available.length)) {
        let added = false;
        for (const group of grouped) {
          const question = group.questions.pop();
          if (question && next.length < requestedCount) {
            next.push(question);
            added = true;
          }
        }
        if (!added) break;
      }
      next = shuffle(next);
    }
    next = next.map((question) =>
      question.choices
        ? { ...question, choices: shuffle(question.choices) }
        : question,
    );
    setQuestions(next);
    setAnswers({});
    setRevealedIds([]);
    setCurrent(0);
    setSeconds(minutes === null ? null : minutes * 60);
    setSubmitted(false);
    setView("exam");
  }

  function submitExam() {
    setSubmitted(true);
    const objectiveResults = results.filter((item) => item.graded);
    const currentObjectiveIds = objectiveResults.map((item) => item.question.id);
    const newlyWrong = objectiveResults
      .filter((item) => !item.correct)
      .map((item) => item.question.id);
    const nextWrong = [
      ...wrongIds.filter((id) => !currentObjectiveIds.includes(id)),
      ...newlyWrong,
    ];
    setWrongIds(nextWrong);
    localStorage.setItem("py-ready-wrong", JSON.stringify(nextWrong));
    const nextHistory = objectiveResults.length
      ? [
          {
            date: new Date().toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            }),
            score,
            total: objectiveResults.length,
            mode: selected.length === categories.length ? "전 범위" : "집중 학습",
          },
          ...history,
        ].slice(0, 8)
      : history;
    setHistory(nextHistory);
    localStorage.setItem("py-ready-history", JSON.stringify(nextHistory));
    setView("result");
  }

  function toggleBookmark(id: string) {
    const next = marked.includes(id)
      ? marked.filter((item) => item !== id)
      : [...marked, id];
    setMarked(next);
    localStorage.setItem("py-ready-bookmarks", JSON.stringify(next));
  }

  function revealAnswer(question: Question) {
    const answer = answers[question.id] ?? "";
    if (!answer.trim() || revealedIds.includes(question.id)) return;
    setRevealedIds((before) => [...before, question.id]);

    if (question.kind === "서술형") return;
    const correct = checkAnswer(question, answer);
    const nextWrong = correct
      ? wrongIds.filter((id) => id !== question.id)
      : wrongIds.includes(question.id)
        ? wrongIds
        : [...wrongIds, question.id];
    setWrongIds(nextWrong);
    localStorage.setItem("py-ready-wrong", JSON.stringify(nextWrong));
  }

  function toggleCategory(category: Category) {
    setSelected((before) =>
      before.includes(category)
        ? before.length === 1
          ? before
          : before.filter((item) => item !== category)
        : [...before, category],
    );
  }

  if (view === "exam") {
    const question = questions[current];
    const isRevealed = revealedIds.includes(question.id);
    const currentAnswer = answers[question.id] ?? "";
    const currentCorrect =
      question.kind !== "서술형" && isRevealed
        ? checkAnswer(question, currentAnswer)
        : false;
    const canReveal =
      question.kind === "서술형"
        ? currentAnswer.trim().length >= 100
        : Boolean(currentAnswer.trim());
    const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;
    return (
      <main className="exam-shell">
        <header className="exam-header">
          <button className="brand small" onClick={() => setView("home")}>
            <span>Py</span>READY
          </button>
          <div className="exam-title">
            <strong>Python 과목평가 실전 모의</strong>
            <span>
              {answeredCount}/{questions.length} 답안 작성
            </span>
          </div>
          <div className={`timer ${seconds !== null && seconds < 300 ? "urgent" : ""}`}>
            <span>남은 시간</span>
            <strong>{seconds === null ? "무제한" : formatTime(seconds)}</strong>
          </div>
        </header>

        <div className="exam-layout">
          <section className="question-panel">
            <div className="question-meta">
              <span
                className="category-pill"
                style={{ "--pill": accent[question.category] } as React.CSSProperties}
              >
                {question.category}
              </span>
              <span>{question.kind}</span>
              <span className={`difficulty difficulty-${question.difficulty}`}>
                {question.difficulty}
              </span>
              <button
                className={`mark-button ${marked.includes(question.id) ? "active" : ""}`}
                onClick={() => toggleBookmark(question.id)}
              >
                {marked.includes(question.id) ? "★ 북마크됨" : "☆ 북마크"}
              </button>
            </div>
            <div className="question-number">문제 {current + 1}</div>
            <h1>{question.question}</h1>
            {question.code && <pre className="code-block">{question.code}</pre>}

            {question.choices ? (
              <div className="choices">
                {question.choices.map((choice, index) => (
                  <button
                    key={choice}
                    className={answers[question.id] === choice ? "selected" : ""}
                    disabled={isRevealed}
                    onClick={() =>
                      setAnswers((before) => ({ ...before, [question.id]: choice }))
                    }
                  >
                    <span>{index + 1}</span>
                    {choice}
                  </button>
                ))}
              </div>
            ) : question.kind === "서술형" ? (
              <div className="answer-field">
                <textarea
                  value={answers[question.id] ?? ""}
                  disabled={isRevealed}
                  onChange={(event) =>
                    setAnswers((before) => ({
                      ...before,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder="문제에서 요구한 핵심 개념, 결과와 이유를 100자 이상으로 작성하세요."
                />
                <span>{(answers[question.id] ?? "").trim().length}자 / 최소 100자</span>
              </div>
            ) : (
              <div className="answer-field">
                <input
                  value={answers[question.id] ?? ""}
                  disabled={isRevealed}
                  onChange={(event) =>
                    setAnswers((before) => ({
                      ...before,
                      [question.id]: event.target.value,
                    }))
                  }
                  placeholder="출력 결과를 입력하세요"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && current < questions.length - 1) {
                      setCurrent(current + 1);
                    }
                  }}
                />
                <span>대소문자·띄어쓰기·따옴표를 포함해 정답만 정확히 입력하세요.</span>
              </div>
            )}

            {isRevealed && (
              <div
                className={[
                  "instant-feedback",
                  question.kind === "서술형"
                    ? "essay"
                    : currentCorrect
                      ? "correct"
                      : "wrong",
                ].join(" ")}
              >
                <strong>
                  {question.kind === "서술형"
                    ? "모범답안과 비교해보세요"
                    : currentCorrect
                      ? "정답입니다"
                      : "정답을 다시 확인해보세요"}
                </strong>
                <p>
                  <b>{question.kind === "서술형" ? "모범답안" : "정답"}</b>
                  {question.answer}
                </p>
                <div>
                  <b>해설</b>
                  {question.explanation}
                </div>
              </div>
            )}

            <div className="question-actions">
              <button
                className="secondary"
                disabled={current === 0}
                onClick={() => setCurrent(current - 1)}
              >
                ← 이전 문제
              </button>
              <button
                className="check-now"
                disabled={!canReveal || isRevealed}
                onClick={() => revealAnswer(question)}
              >
                {isRevealed
                  ? "확인 완료"
                  : question.kind === "서술형"
                    ? "모범답안 보기"
                    : "지금 채점하기"}
              </button>
              {current < questions.length - 1 ? (
                <button className="primary" onClick={() => setCurrent(current + 1)}>
                  다음 문제 →
                </button>
              ) : (
                <button className="primary submit" onClick={submitExam}>
                  답안 제출
                </button>
              )}
            </div>
          </section>

          <aside className="answer-sheet">
            <div>
              <p>답안 현황</p>
              <strong>{Math.round((answeredCount / questions.length) * 100)}%</strong>
            </div>
            <div className="progress">
              <i style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
            </div>
            <div className="number-grid">
              {questions.map((item, index) => (
                <button
                  key={item.id}
                  className={[
                    index === current ? "current" : "",
                    answers[item.id]?.trim() ? "answered" : "",
                    revealedIds.includes(item.id) ? "revealed" : "",
                    marked.includes(item.id) ? "marked" : "",
                  ].join(" ")}
                  onClick={() => setCurrent(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="legend">
              <span><i className="dot answered" />답변 완료</span>
              <span><i className="dot revealed" />개별 확인</span>
              <span><i className="dot marked" />검토 표시</span>
            </div>
            <button className="finish-button" onClick={submitExam}>
              시험 종료 및 채점
            </button>
            <p className="save-note">오답과 북마크 기록은 이 브라우저에 저장됩니다.</p>
          </aside>
        </div>
      </main>
    );
  }

  if (view === "result") {
    const percent = gradedResults.length
      ? Math.round((score / gradedResults.length) * 100)
      : 0;
    const wrong = results
      .filter((item) => item.graded && !item.correct)
      .map((item) => item.question);
    return (
      <main className="result-page">
        <header className="simple-header">
          <button className="brand small" onClick={() => setView("home")}>
            <span>Py</span>READY
          </button>
          <button className="text-button" onClick={() => setView("home")}>
            대시보드로 돌아가기
          </button>
        </header>
        <section className="result-hero">
          <div className="result-copy">
            <p className="eyebrow">모의평가 결과</p>
            <h1>
              {percent >= 80
                ? "합격권에 들어왔어요."
                : percent >= 60
                  ? "조금만 더 다듬으면 돼요."
                  : "약점부터 차근차근 잡아봐요."}
            </h1>
            <p>
              맞힌 문제보다 틀린 이유가 더 중요합니다. 아래 해설에서 실수한
              개념을 확인하고 바로 다시 도전하세요.
            </p>
            <div className="result-actions">
              <button className="primary" onClick={() => startExam()}>
                새 모의고사
              </button>
              {wrong.length > 0 && (
                <button className="secondary" onClick={() => startExam(wrong)}>
                  오답 {wrong.length}문제 다시 풀기
                </button>
              )}
            </div>
          </div>
          <div className="score-ring" style={{ "--score": `${percent * 3.6}deg` } as React.CSSProperties}>
            <div>
              <strong>{percent}</strong>
              <span>점</span>
              <small>{score} / {gradedResults.length} 정답 · 서술형 제외</small>
            </div>
          </div>
        </section>

        <section className="analysis-card">
          <div className="section-heading">
            <div>
              <span className="section-kicker">영역 분석</span>
              <h2>어디를 더 공부해야 할까요?</h2>
            </div>
          </div>
          <div className="category-results">
            {categories.map((category) => {
              const items = results.filter((item) => item.question.category === category);
              if (!items.length) return null;
              const objectiveItems = items.filter((item) => item.graded);
              if (!objectiveItems.length) return null;
              const correct = objectiveItems.filter((item) => item.correct).length;
              const rate = Math.round((correct / objectiveItems.length) * 100);
              return (
                <div key={category}>
                  <div>
                    <strong>{category}</strong>
                    <span>{correct}/{objectiveItems.length}</span>
                  </div>
                  <div className="category-bar">
                    <i style={{ width: `${rate}%`, background: accent[category] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="review-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">문항별 해설</span>
              <h2>답을 복기해보세요</h2>
            </div>
            <span className="review-count">오답 {wrong.length}개</span>
          </div>
          <div className="review-list">
            {results.map(({ question, correct, graded }, index) => (
              <details
                key={question.id}
                className={!graded ? "essay" : correct ? "correct" : "wrong"}
                open={!graded || !correct}
              >
                <summary>
                  <span className="result-icon">{!graded ? "✎" : correct ? "✓" : "!"}</span>
                  <div>
                    <small>{question.category} · 문제 {index + 1}</small>
                    <strong>{question.question}</strong>
                  </div>
                  <span className="review-status">
                    {!graded ? "자가 확인" : correct ? "정답" : "오답"}
                  </span>
                </summary>
                <div className="review-body">
                  {question.code && <pre className="code-block compact">{question.code}</pre>}
                  <p><b>내 답안</b>{answers[question.id] || "미응답"}</p>
                  <p><b>{!graded ? "모범답안" : "정답"}</b>{question.answer}</p>
                  <div className="explanation">
                    <b>판단 과정과 핵심 원리</b>
                    {question.explanation}
                  </div>
                  {!graded && (
                    <div className="self-review">
                      <span>내 답과 모범답안을 비교했나요?</span>
                      <button onClick={() => toggleBookmark(question.id)}>
                        {marked.includes(question.id) ? "★ 다시 볼 문제" : "☆ 다시 보기로 저장"}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const average =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + (item.score / item.total) * 100, 0) /
            history.length,
        )
      : 0;
  const selectedQuestionCount = questionBank.filter((question) =>
    selected.includes(question.category),
  ).length;
  const configuredQuestionCount =
    count === "all" ? selectedQuestionCount : Math.min(count, selectedQuestionCount);

  return (
    <main>
      <header className="home-header">
        <div className="brand"><span>Py</span>READY</div>
        <span className="local-save-status">이 브라우저에 자동 저장</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SSAFY 16기 · Python 과목평가</p>
          <h1>
            읽는 공부에서,
            <br />
            <em>맞히는 공부</em>로.
          </h1>
          <p className="hero-description">
            실제 수업 코드에서 뽑은 실행 결과·개념 문항을 시간 안에 풀고,
            영역별 약점을 바로 확인하세요.
          </p>
          <div className="hero-actions">
            <button className="primary large" onClick={() => startExam()}>
              실전 모의평가 시작 <span>→</span>
            </button>
            <a href="#practice">시험 설정하기</a>
          </div>
          <div className="exam-facts">
            <div><strong>8.03</strong><span>평가일</span></div>
            <div><strong>09:00</strong><span>시작 시간</span></div>
            <div><strong>60분</strong><span>실제 시험</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-label="학습 현황 미리보기">
          <div className="floating-tag tag-one">실행 결과 집중</div>
          <div className="floating-tag tag-two">71개 검증 문항</div>
          <div className="preview-card">
            <div className="preview-top">
              <span>오늘의 준비도</span>
              <b>{history.length ? `${average}%` : "START"}</b>
            </div>
            <div className="mini-chart">
              {[42, 58, 51, 72, 68, average || 76].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="preview-question">
              <span>PYTHON · 실행 결과</span>
              <code>numbers.sort()</code>
              <p>반환되는 값은 무엇일까요?</p>
              <b>None</b>
            </div>
          </div>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
        </div>
      </section>

      <section className="prep-strip">
        <span>평가 범위</span>
        {categories.map((category) => <b key={category}>{category}</b>)}
      </section>

      <section className="practice-section" id="practice">
        <div className="section-heading">
          <div>
            <span className="section-kicker">PYREADY · {questionBank.length}문항</span>
            <h2>Python 과목평가 연습</h2>
          </div>
          <p>범위와 문항 수를 고르고 바로 시작하세요.</p>
        </div>

        <div className="study-summary">
          <div>
            <span>누적 오답</span>
            <strong>{wrongIds.length}</strong>
            <button
              disabled={!wrongIds.length}
              onClick={() =>
                startExam(questionBank.filter((question) => wrongIds.includes(question.id)))
              }
            >
              오답 다시 풀기
            </button>
          </div>
          <div>
            <span>북마크</span>
            <strong>{marked.length}</strong>
            <button
              disabled={!marked.length}
              onClick={() =>
                startExam(questionBank.filter((question) => marked.includes(question.id)))
              }
            >
              저장한 문제 풀기
            </button>
          </div>
          <div>
            <span>최근 평균</span>
            <strong>{history.length ? `${average}%` : "—"}</strong>
            <small>서술형을 제외한 자동 채점 결과</small>
          </div>
        </div>

        <div className="setup-grid">
          <div className="setup-card wide">
            <div className="setup-title">
              <span>01</span>
              <div><strong>출제 범위</strong><small>최소 한 영역을 선택하세요</small></div>
              <button onClick={() => setSelected(categories)}>전체 선택</button>
            </div>
            <div className="category-select">
              {categories.map((category) => (
                <button
                  key={category}
                  className={selected.includes(category) ? "active" : ""}
                  onClick={() => toggleCategory(category)}
                  style={{ "--category": accent[category] } as React.CSSProperties}
                >
                  <i>{selected.includes(category) ? "✓" : "+"}</i>
                  <span>{category}</span>
                  <small>{questionBank.filter((question) => question.category === category).length}문제</small>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-card">
            <div className="setup-title">
              <span>02</span>
              <div><strong>문항 수</strong><small>집중도에 맞게 선택</small></div>
            </div>
            <div className="segment">
              {([10, 20, 30] as QuestionCount[]).map((value) => (
                <button
                  key={value}
                  className={count === value ? "active" : ""}
                  onClick={() => setCount(value)}
                >
                  <strong>{value}</strong>문제
                </button>
              ))}
              <button
                className={count === "all" ? "active" : ""}
                onClick={() => setCount("all")}
              >
                <strong>전체</strong>{selectedQuestionCount}문제
              </button>
            </div>
          </div>

          <div className="setup-card">
            <div className="setup-title">
              <span>03</span>
              <div><strong>제한 시간</strong><small>무제한 또는 실전 60분</small></div>
            </div>
            <div className="segment">
              <button
                className={minutes === null ? "active" : ""}
                onClick={() => setMinutes(null)}
              >
                <strong>∞</strong>무제한
              </button>
              <button
                className={minutes === 60 ? "active" : ""}
                onClick={() => setMinutes(60)}
              >
                <strong>60</strong>분
              </button>
            </div>
          </div>
        </div>
        <button className="start-banner" onClick={() => startExam()}>
          <span>
            <b>{selected.length}개 영역 · {configuredQuestionCount}문제 · {minutes === null ? "시간 무제한" : "60분"}</b>
            준비되었다면 바로 시작하세요. 오답과 북마크는 이 브라우저에 저장됩니다.
          </span>
          <strong>모의평가 시작하기 →</strong>
        </button>
      </section>

      <section className="progress-section" id="progress">
        <div className="section-heading">
          <div>
            <span className="section-kicker">학습 기록</span>
            <h2>쌓이는 만큼, 실력이 보여요.</h2>
          </div>
        </div>
        <div className="progress-layout">
          <div className="stat-card featured">
            <span>최근 평균 정답률</span>
            <strong>{history.length ? average : "—"}<small>{history.length ? "%" : ""}</small></strong>
            <p>{history.length ? "이 브라우저에 저장된 최근 기록 기준" : "첫 모의평가를 완료하면 분석이 시작됩니다."}</p>
          </div>
          <div className="history-card">
            <div className="history-head"><strong>최근 응시 기록</strong><span>최대 8회 저장</span></div>
            {history.length ? (
              history.slice(0, 4).map((item, index) => (
                <div className="history-row" key={`${item.date}-${index}`}>
                  <span>{item.date}</span>
                  <b>{item.mode}</b>
                  <i>{item.score}/{item.total}</i>
                  <strong>{Math.round((item.score / item.total) * 100)}점</strong>
                </div>
              ))
            ) : (
              <div className="empty-history">
                아직 기록이 없어요. 첫 시험을 시작해보세요.
              </div>
            )}
          </div>
        </div>
      </section>

      <footer>
        <div className="brand small"><span>Py</span>READY</div>
        <p>교재와 라이브 코드를 바탕으로 만든 개인 학습 도구</p>
        <span>시험일까지 D-4</span>
      </footer>
    </main>
  );
}
