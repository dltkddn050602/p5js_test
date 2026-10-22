
let images = {};

const FILES = {
  teacher: 'teacher.png',
  hallway: 'hallway.png',
  woah: 'woah.png',
  ending: 'ending.png',
  player: 'player.png',
  endingPlayer: 'endingPlayer.png',
  endingTeacher: 'endingTeacher.png',
  classroom: 'classroom.png',
  locker: 'locker.png',
  floor4Enemy: 'floor4Enemy.png', 
  stairs: 'stairs.png',
  floor3: 'floor3.png',
  keypad: 'keypad.png',
  lobby1: 'lobby1.png',
  frontDoor: 'frontDoor.jpeg',
  ghostGirl: 'ghostGirl.png',
  ghostScare: 'ghostScare.png',
  book: 'book.png',
  npc: 'npc.png'
  

};

// 처음 스토리
const STORY = [
  '정신을 차려보니 교실이었다...',
  '학교에는 아무도 없는 것 같다.',
  '이상하고 불길한 기운이 감돈다. 어서 학교를 탈출해야 한다.',
  '[ 4층 미션 안내 ]',
  '복도에는 사물함 7개가 있다. 진짜 3개, 가짜 4개!',
  '진짜 사물함에 2번 안전하게 숨으면 4층을 통과한다.'
];

// NPC 대사
const NPC_LINES = [
  '너... 아직 학교에 남아 있었어?',
  '4층 복도에 그것이 돌아다니고 있어...',
  '사물함에 들어가면 그것이 다가올 거야.',
  '진짜 사물함 2개를 찾아야 해. 조심해...'
];

// 두 게임 사이 주인공 대사
const INTERLUDE =
  '아직 방심하면 안돼 아직 2층이 남아있어 빨리 가보자!';

// 마지막 엔딩 대사
const END_PLAYER =
  '탈출을 도와줘서 고마워! 너 덕분에 탈출했어!';

const END_TEACHER = '하,,,,아깝군';

// 게임 상태
let state = 'title';

let storyIndex = 0;
let dialogueIndex = 0;
let endingStep = 0;

// 대사 출력
let speech = '';
let speechIndex = 0;

// 주인공
let player = {
  x: 100,
  y: 300,
  speed: 4
};

// 사물함 게임
let lockers = [];
let selectedLocker = null;
let clearedCount = 0;

// 게임 진행 시간
let phaseStart = 0;
let gameOverAlpha = 0;

// 어느 게임에서 실패했는지
let failedStage = 'locker';

// 장애물 게임
let obstacles = [];
let score = 0;
let spawnCounter = 0;

// 마우스와 모바일 터치
let lastTouchTime = -1000;
let pointerHeld = false;
let pointerX = 0;
let pointerY = 0;

// 이동 버튼
const PAD = {
  left: {
    x: 20, y: 405, w: 75, h: 75,
    label: '◀'
  },
  right: {
    x: 105, y: 405, w: 75, h: 75,
    label: '▶'
  },
  up: {
    x: 664, y: 405, w: 75, h: 75,
    label: '▲'
  },
  down: {
    x: 749, y: 405, w: 75, h: 75,
    label: '▼'
  }
};

// 이미지 불러오기
function preload() {
  for (const key in FILES) {
    images[key] = loadImage(
      FILES[key],
      () => {},
      () => {
        images[key] = null;
        console.warn('이미지 확인:', FILES[key]);
      }
    );
  }
}

// 게임 준비
function setup() {
  const c = createCanvas(844, 500);

  // 아이패드 터치 설정
  c.style('touch-action', 'none');
  c.style('user-select', 'none');
  c.style('-webkit-user-select', 'none');

  // 화면 크기 조절
  c.style('max-width', '100%');
  c.style('height', 'auto');

  textFont('sans-serif');

  resetAll();
}

// 게임 전체 초기화
function resetAll() {
  state = 'title';
  storyIndex = 0;
  endingStep = 0;

  resetLocker();
  resetObstacle();
  resetSpeech();
  resetLobbyFinal();
}

// 사물함 게임 초기화
function resetLocker() {
  player.x = 95;
  player.y = 300;

  clearedCount = 0;
  dialogueIndex = 0;
  selectedLocker = null;

  lockers = [];

  const order = shuffle([0, 1, 2, 3, 4, 5, 6]);

  for (let i = 0; i < 7; i++) {
    lockers.push({
      x: 130 + i * 96,
      y: i % 2 === 0 ? 170 : 290,
      w: 76,
      h: 126,
      real: order.indexOf(i) < 4,
      cleared: false
    });
  }
}

// 장애물 게임 초기화
function resetObstacle() {
  obstacles = [];
  score = 0;
  spawnCounter = 0;

  player.x = 422;
  player.y = 430;

  gameOverAlpha = 0;
}

// 대사 초기화
function resetSpeech() {
  speech = '';
  speechIndex = 0;
}

// 화면 상태 변경
function setState(s) {
  state = s;
  phaseStart = millis();
}

// 버튼 클릭 범위 확인
function hit(x, y, bx, by, bw, bh) {
  return (
    x >= bx &&
    x <= bx + bw &&
    y >= by &&
    y <= by + bh
  );
}

// 이미지 표시
function drawImage(key, x, y, w, h) {
  imageMode(CORNER);

  if (images[key] && images[key].width > 0) {
    image(images[key], x, y, w, h);
  } else {
    fill(35, 39, 49);
    rect(x, y, w, h);
  }
}


// ======================================
// 2/5 메인 화면과 사물함 게임
// ======================================

// 메인 게임 루프
function draw() {
  background(0);
  rectMode(CORNER);
  imageMode(CORNER);
  noTint();
  noStroke();

  if (state === 'title') {
    drawTitle();
  } else if (state === 'story') {
    drawStory();
  } else if (state === 'classroom') {
    drawClassroom();
  
  } else if (state === 'stairBefore') {
    drawStairScene();
  } else if (state === 'stairAfter') {
    drawStairScene();

  } else if (state === 'corridor4') {
    drawCorridor4();
  } else if (state === 'npcTalk') {
    drawCorridor4();
    drawNpcDialogue();
  } else if (state === 'lockerEntering') {
    drawLockerEntering();
  } else if (state === 'lockerInside') {
    drawLockerInside();
  } else if (state === 'lockerOver') {
    drawLockerOver();
  } else if (state === 'stairBefore') {
  drawStairScene();
  } else if (state === 'stairAfter') {
  drawStairScene();
  } else if (state === 'interlude') {
  drawInterlude();
  } else if (state === 'obstacle') {
    drawObstacle();
  } else if (state === 'floor3') {
  drawFloor3();
  } else if (state === 'floor3Note') {
  drawFloor3();
  drawFloor3Note();
  } else if (state === 'floor3Keypad') {
  drawFloor3Keypad();
  } else if (state === 'floor3Win') {
  drawFloor3Win();
  } else if (state === 'obstacleOver') {
    drawObstacleOver();
  } else if (state === 'success') {
  drawSuccess();
  } else if (state === 'lobbyFinal') {
  drawLobbyFinal();
  } else if (state === 'frontDoorFinal') {
  drawFrontDoorFinal();
    
  } else if (state === 'ghostQuiz') {
  drawGhostQuiz();
  } else if (state === 'ghostOver') {
  drawGhostOver();
  } else if (state === 'ending') {
  drawEnding();
  } else if (state === 'end') {
    drawEnd();

} else if (state === 'animalNotebook') {
  drawAnimalNotebook();

  }
}

// 공통 버튼 그리기
function drawButton(label, x, y, w, h) {
  rectMode(CORNER);
  noStroke();

  fill(65, 65, 75);
  rect(x, y, w, h, 10);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(20);

  text(label, x + w / 2, y + h / 2);
}

// 상단 안내 문구
function drawInstruction(message) {
  noStroke();
  fill(0, 190);
  rect(0, 0, width, 55);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(17);

  text(message, width / 2, 27, width - 30);
}

// 게임 시작 화면
function drawTitle() {
  background(0);

  fill(210, 25, 25);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(52);

  text('학교 탈출', width / 2, 185);

  fill(255);
  textStyle(NORMAL);
  textSize(23);

  text('School Escape', width / 2, 250);

  drawButton(
    '게임 시작',
    width / 2 - 110,
    325,
    220,
    60
  );
}

// 스토리 화면
function drawStory() {
  background(0);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(25);

  text(
    STORY[storyIndex],
    65,
    100,
    width - 130,
    270
  );

  fill(180);
  textSize(17);

  text(
    '화면을 클릭하거나 터치하면 다음으로 넘어갑니다',
    width / 2,
    440
  );
}

// 교실 화면
function drawClassroom() {

  // 교실 배경
  drawImage(
    'classroom',
    0,
    0,
    width,
    height
  );

  drawInstruction(
    '교실에서 탈출하자! 오른쪽으로 이동해 4층 복도로 나가세요.'
  );

  // 주인공 이동
  movePlayer4Directions();

  // 주인공 이미지
  drawPlayer(
    player.x,
    player.y,
    75,
    105
  );

  // 교실의 동물 관찰 노트 표시
  drawAnimalNotebookIcon();

  // 이동 버튼
  drawMovePad();

  // 교실 오른쪽 끝에 도착
  if (player.x >= width - 45) {
    player.x = 75;
    player.y = 300;

    resetSpeech();
setState('stairBefore');
  }
}

// 4층 복도 화면
function drawCorridor4() {

  // 교실 이미지를 복도 배경으로 활용
  drawImage(
    'classroom',
    0,
    0,
    width,
    height
  );

  // 어둡게 처리
  noStroke();
  fill(0, 0, 0, 105);
  rect(0, 0, width, height);

  // 사물함 이미지 7개
  for (let locker of lockers) {
    drawLocker(locker);
  }

  // NPC
  drawNpc();

  // 대화 중에는 움직이지 않음
  if (state === 'corridor4') {
    movePlayer4Directions();
  }

  // 주인공
  drawPlayer(
    player.x,
    player.y,
    75,
    105
  );

  // 성공 횟수 표시
  fill(255, 230, 90);
  stroke(0);
  strokeWeight(3);
  textAlign(LEFT, TOP);
  textSize(20);
  textStyle(BOLD);

  text(
    '통과한 사물함: ' + clearedCount + ' / 2',
    20,
    65
  );

  noStroke();

  // 안내 문구
  drawInstruction(
    '사물함을 눌러 숨으세요! 진짜 사물함 2개를 통과해야 합니다.'
  );

  if (state === 'corridor4') {
    drawMovePad();
  }

  // 성공하면 다음 장면으로
  if (
    state === 'corridor4' &&
    clearedCount >= 2
  ) {
    resetSpeech();
    setState('stairAfter');
  }
}

// 사물함 이미지 그리기
function drawLocker(locker) {

  imageMode(CENTER);

  // 실제 사물함 이미지 사용
  if (
    images.locker &&
    images.locker.width > 0
  ) {
    image(
      images.locker,
      locker.x,
      locker.y,
      locker.w,
      locker.h
    );
  } else {
    rectMode(CENTER);

    fill(55, 60, 70);
    stroke(110);
    strokeWeight(2);

    rect(
      locker.x,
      locker.y,
      locker.w,
      locker.h,
      5
    );
  }

  imageMode(CORNER);
  rectMode(CORNER);
  noStroke();

  // 이미 통과한 사물함 표시
  if (locker.cleared) {
    noFill();
    stroke(70, 255, 130);
    strokeWeight(4);

    rect(
      locker.x - locker.w / 2,
      locker.y - locker.h / 2,
      locker.w,
      locker.h,
      6
    );

    noStroke();
    fill(70, 255, 130);
    textAlign(CENTER, CENTER);
    textSize(15);

    text(
      '통과 완료',
      locker.x,
      locker.y + locker.h / 2 + 12
    );
  }
}

// NPC 그리기


function drawNpc() {

  // NPC 위치 (사물함보다 아래쪽)
  let npcX = 420;
  let npcY = 415;

  push();
  imageMode(CENTER);

  // NPC 이미지
  if (images.npc && images.npc.width > 0) {
    image(
      images.npc,
      npcX,
      npcY - 35,
      75,
      105
    );
  }

  pop();

  // NPC 이름 표시
  fill(255);
  stroke(0);
  strokeWeight(3);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(17);

  text(
    'NPC',
    npcX,
    npcY - 100
  );

  noStroke();
}


 // 주인공 이미지
function drawPlayer(x, y, w, h) {

  imageMode(CENTER);

  if (
    images.player &&
    images.player.width > 0
  ) {
    image(
      images.player,
      x,
      y,
      w,
      h
    );
  } else {
    noStroke();
    fill(80, 150, 255);
    ellipse(x, y, w * 0.7, h * 0.7);
  }

  imageMode(CORNER);
}

function drawNpcDialogue() {

  noStroke();
  fill(0, 0, 0, 225);

  // 대화창 배경
  rect(
    35,
    305,
    width - 70,
    155,
    18
  );

  // 대화창 테두리
  stroke(255);
  strokeWeight(2);
  noFill();

  rect(
    35,
    305,
    width - 70,
    155,
    18
  );

  noStroke();

  // NPC 대사
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(22);

  text(
    NPC_LINES[dialogueIndex],
    65,
    320,
    width - 130,
    90
  );

  // 안내 문구
  fill(180);
  textSize(15);

  text(
    '클릭해서 다음 대사 보기',
    width / 2,
    435
  );
}

// 방향 버튼
function drawMovePad() {

  for (let key in PAD) {
    let b = PAD[key];

    noStroke();
    fill(55, 55, 65, 225);

    rect(
      b.x,
      b.y,
      b.w,
      b.h,
      12
    );

    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(NORMAL);
    textSize(29);

    text(
      b.label,
      b.x + b.w / 2,
      b.y + b.h / 2
    );
  }
}

// 4방향 이동
function movePlayer4Directions() {

  // 키보드 이동
  if (keyIsDown(LEFT_ARROW)) {
    player.x -= player.speed;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    player.x += player.speed;
  }

  if (keyIsDown(UP_ARROW)) {
    player.y -= player.speed;
  }

  if (keyIsDown(DOWN_ARROW)) {
    player.y += player.speed;
  }

  // 마우스 및 터치 버튼 이동
  if (pointerHeld) {

    if (
      hit(
        pointerX,
        pointerY,
        PAD.left.x,
        PAD.left.y,
        PAD.left.w,
        PAD.left.h
      )
    ) {
      player.x -= player.speed;
    }

    if (
      hit(
        pointerX,
        pointerY,
        PAD.right.x,
        PAD.right.y,
        PAD.right.w,
        PAD.right.h
      )
    ) {
      player.x += player.speed;
    }

    if (
      hit(
        pointerX,
        pointerY,
        PAD.up.x,
        PAD.up.y,
        PAD.up.w,
        PAD.up.h
      )
    ) {
      player.y -= player.speed;
    }

    if (
      hit(
        pointerX,
        pointerY,
        PAD.down.x,
        PAD.down.y,
        PAD.down.w,
        PAD.down.h
      )
    ) {
      player.y += player.speed;
    }
  }

  player.x = constrain(
    player.x,
    35,
    width - 35
  );

  player.y = constrain(
    player.y,
    110,
    350
  );
}


// ======================================
// 3/5 사물함 숨기 게임
// ======================================

// 사물함에 들어가는 연출
function drawLockerEntering() {

  background(0);

  // 사물함 이미지
  imageMode(CENTER);

  if (
    images.locker &&
    images.locker.width > 0
  ) {
    image(
      images.locker,
      width / 2,
      height / 2,
      200,
      380
    );
  }

  imageMode(CORNER);

  // 안내 문구
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(25);

  text(
    '사물함 속으로 숨는 중...',
    width / 2,
    65
  );

  fill(180);
  textSize(18);

  text(
    '철컥... 문이 닫혔다.',
    width / 2,
    460
  );

  // 1초 후 사물함 내부로 이동
  if (millis() - phaseStart >= 1000) {
    setState('lockerInside');
  }
}

// 사물함 내부 화면
function drawLockerInside() {

  background(10, 10, 15);

  // 사물함 안쪽처럼 보이는 어두운 테두리
  noStroke();
  fill(25, 25, 32);

  rect(0, 0, 95, height);
  rect(width - 95, 0, 95, height);

  // 사물함 틈새
  stroke(65, 65, 75);
  strokeWeight(4);

  line(95, 0, 95, height);
  line(width - 95, 0, width - 95, height);

  noStroke();

  // 화면 위쪽 안내
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(20);

  text(
    '쉿... 숨을 죽이고 기다리자.',
    width / 2,
    50
  );

  // 악당 등장 시간
  let elapsed = millis() - phaseStart;

  // 진짜 사물함
  if (selectedLocker && selectedLocker.real) {

    // 악당이 오른쪽에서 왼쪽으로 지나감
    let enemyX = map(
      elapsed,
      0,
      4000,
      width + 100,
      -150
    );

    drawFloor4Enemy(
      enemyX,
      265,
      180,
      270
    );

    // 발소리 자막
    fill(255, 100, 100);
    textSize(19);

    text(
      '터벅... 터벅... 터벅...',
      width / 2,
      430
    );

    // 4초 후 안전하게 통과
    if (elapsed >= 4000) {

      if (!selectedLocker.cleared) {
        selectedLocker.cleared = true;
        clearedCount++;
      }

      selectedLocker = null;

      // 진짜 사물함 2개 성공
      if (clearedCount >= 2) {
        resetSpeech();
        setState('stairAfter');
      } else {
        setState('corridor4');
      }
    }

  } else {

    // 가짜 사물함
    // 악당이 정면으로 점점 가까워짐
    let enemySize = map(
      elapsed,
      0,
      3500,
      80,
      520
    );

    enemySize = constrain(
      enemySize,
      80,
      520
    );

    drawFloor4Enemy(
      width / 2,
      height / 2 + 40,
      enemySize * 0.7,
      enemySize
    );

    fill(255, 60, 60);
    textSize(22);

    text(
      '...들킨 것 같다!',
      width / 2,
      440
    );

    // 3.5초 후 게임오버
    if (elapsed >= 3500) {
      failedStage = 'locker';
      setState('lockerOver');
    }
  }
}

// 4층 악당 이미지
function drawFloor4Enemy(x, y, w, h) {

  imageMode(CENTER);

  if (
    images.floor4Enemy &&
    images.floor4Enemy.width > 0
  ) {
    image(
      images.floor4Enemy,
      x,
      y,
      w,
      h
    );
  } else {

    // 이미지가 없을 때 대체 그림
    noStroke();

    fill(100, 95, 90);
    ellipse(x, y - h * 0.2, w * 0.7, h * 0.45);

    fill(70, 65, 60);
    rectMode(CENTER);
    rect(x, y + h * 0.18, w * 0.6, h * 0.55, 15);

    rectMode(CORNER);
  }

  imageMode(CORNER);
}

// 사물함 게임오버 화면
function drawLockerOver() {

  background(0);

  // 악당 이미지
  imageMode(CENTER);

  if (
    images.floor4Enemy &&
    images.floor4Enemy.width > 0
  ) {
    image(
      images.floor4Enemy,
      width / 2,
      180,
      170,
      240
    );
  }

  imageMode(CORNER);

  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(65);

  text(
    'GAME OVER',
    width / 2,
    325
  );

  fill(255);
  textStyle(NORMAL);
  textSize(18);

  text(
    '가짜 사물함에 숨어서 들켜버렸다...',
    width / 2,
    375
  );

  // 다시하기 버튼
  drawButton(
    '사물함부터 다시하기',
    width / 2 - 140,
    415,
    280,
    55
  );
}

// 사물함 선택
function selectLocker(x, y) {

  // 사물함 화면에서만 선택 가능
  if (state !== 'corridor4') {
    return false;
  }

  // 사물함 7개 확인
  for (let locker of lockers) {

    if (
      hit(
        x,
        y,
        locker.x - locker.w / 2,
        locker.y - locker.h / 2,
        locker.w,
        locker.h
      )
    ) {

      // 이미 통과한 사물함은 재선택 불가
      if (locker.cleared) {
        return true;
      }

      selectedLocker = locker;

      // 사물함에 들어가는 장면 시작
      setState('lockerEntering');

      return true;
    }
  }

  return false;
}

// NPC 클릭 확인

function selectNpc(x, y) {

  if (state !== 'corridor4') {
    return false;
  }

  // NPC의 새로운 위치
  let npcX = 420;
  let npcY = 380;

  // NPC를 클릭하면 대화 시작
  if (
    dist(x, y, npcX, npcY) < 60 &&
    dist(player.x, player.y, npcX, npcY) < 150
  ) {
    dialogueIndex = 0;
    setState('npcTalk');

    return true;
  }

  return false;
}


// 사물함 게임만 재시작
function restartLockerStage() {

  resetLocker();

  // 스토리와 교실은 다시 하지 않음
  setState('corridor4');
}

// 사물함 통과 상태 확인
function lockerStageComplete() {

  if (clearedCount >= 2) {

    selectedLocker = null;

    resetSpeech();

    setState('stairAfter');

    return true;
  }

  return false;
}


// ======================================
// 4/5 중간 대사 + 장애물 피하기 게임
// ======================================

// 중간 주인공 대사 화면
function drawInterlude() {

  // 검은 배경
  background(0);

  // 기존 엔딩과 동일한 주인공 이미지
  imageMode(CENTER);

  if (
    images.endingPlayer &&
    images.endingPlayer.width > 0
  ) {
    image(
      images.endingPlayer,
      210,
      330,
      330,
      460
    );
  }

  imageMode(CORNER);

  // 기존 엔딩과 동일한 반투명 말풍선
  noStroke();
  fill(255, 180);
  rect(40, 280, 764, 170, 25);

  // 글자가 한 글자씩 나타남
  if (
    frameCount % 3 === 0 &&
    speechIndex < INTERLUDE.length
  ) {
    speech += INTERLUDE.charAt(speechIndex);
    speechIndex++;
  }

  // 대사 출력
  fill(0);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(28);

  text(
    speech,
    80,
    320,
    680,
    100
  );

  // 대사가 모두 나타나면 다음 버튼
  if (speechIndex >= INTERLUDE.length) {
    drawNextButton();
  }
}


 // 엔딩과 동일한 다음 버튼
function drawNextButton() {

  rectMode(CORNER);
  noStroke();

  fill(70);
  rect(
    width - 150,
    390,
    100,
    45,
    10
  );

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(20);

  text(
    '다음',
    width - 100,
    412
  );
}

// 장애물 피하기 게임
function drawObstacle() {

  // 기존 복도 배경 이미지
  drawImage(
    'hallway',
    0,
    0,
    width,
    height
  );

  // 장애물 생성
  spawnCounter++;

  if (spawnCounter >= 30) {

    obstacles.push({
      x: random(80, 764),
      y: -40
    });

    spawnCounter = 0;
  }

  // 장애물 이동
  imageMode(CENTER);

  for (
    let i = obstacles.length - 1;
    i >= 0;
    i--
  ) {

    obstacles[i].y += 10;

    // 기존 선생님 장애물 이미지
    if (
      images.teacher &&
      images.teacher.width > 0
    ) {
      image(
        images.teacher,
        obstacles[i].x,
        obstacles[i].y,
        80,
        80
      );
    } else {
      noStroke();
      fill(200, 40, 40);

      ellipse(
        obstacles[i].x,
        obstacles[i].y,
        80,
        80
      );
    }

    // 충돌 판정
    if (
      dist(
        player.x,
        player.y,
        obstacles[i].x,
        obstacles[i].y
      ) < 40
    ) {

      imageMode(CORNER);

      failedStage = 'obstacle';
      gameOverAlpha = 0;

      setState('obstacleOver');
      return;
    }

    // 장애물을 피했을 때
    if (obstacles[i].y > 520) {

      obstacles.splice(i, 1);
      score++;

      console.log('피한 장애물:', score);

      // 30개를 피하면 성공!
      if (score >= 30) {

        imageMode(CORNER);

        setState('success');
        return;
      }
    }
  }

  // 주인공 이미지
  if (
    images.player &&
    images.player.width > 0
  ) {
    image(
      images.player,
      player.x,
      player.y,
      100,
      140
    );
  } else {
    noStroke();
    fill(70, 150, 255);

    ellipse(
      player.x,
      player.y,
      70,
      100
    );
  }

  imageMode(CORNER);

  // 좌우 이동 버튼
  noStroke();
  fill(70);

  rect(20, 400, 80, 80, 15);
  rect(744, 400, 80, 80, 15);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(40);

  text('◀', 60, 440);
  text('▶', 784, 440);

  // 현재 점수 표시
  stroke(0);
  strokeWeight(3);
  fill(255);

  textSize(22);
  textStyle(BOLD);

  text(
    'SCORE: ' + score + ' / 30',
    width / 2,
    30
  );

  noStroke();
}

// 장애물 게임오버 화면
function drawObstacleOver() {

  background(0);

  // 사진이 서서히 나타남
  gameOverAlpha = min(
    gameOverAlpha + 4,
    255
  );

  imageMode(CENTER);

  // 기존 게임오버 이미지
  if (
    images.woah &&
    images.woah.width > 0
  ) {

    tint(255, gameOverAlpha);

    image(
      images.woah,
      width / 2,
      150,
      220,
      220
    );

    noTint();
  }

  imageMode(CORNER);

  // 사진 등장 후 게임오버 글자 표시
  if (gameOverAlpha > 180) {

    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(100);

    text(
      'YOU DIE',
      width / 2,
      height / 2 - 20
    );

    // 다시하기 버튼
    rectMode(CORNER);
    noStroke();

    fill(70);
    rect(
      width / 2 - 110,
      370,
      220,
      55,
      10
    );

    fill(255);
    textStyle(NORMAL);
    textSize(20);

    text(
      '장애물부터 다시하기',
      width / 2,
      398
    );
  }
}

// 장애물 게임만 재시작
function restartObstacleStage() {

  // 점수, 장애물, 주인공 위치 초기화
  resetObstacle();

  // 사물함 게임으로 돌아가지 않음
  setState('obstacle');
}

// 장애물 게임 시작
function startObstacleStage() {

  resetObstacle();

  setState('obstacle');
}

// 장애물 게임 성공 확인
function obstacleStageComplete() {

  if (score >= 30) {

    setState('success');

    return true;
  }

  return false;
}


// ======================================
// 5/5 성공 화면 + 엔딩 + 버튼 연결
// 아이패드 터치 수정 포함
// ======================================

// 탈출 성공 화면
function drawSuccess() {
  background(0);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(55);
  fill(255);

  text(
    '탈출 성공!',
    width / 2,
    180
  );

  drawButton(
    '엔딩 보기',
    width / 2 - 110,
    250,
    220,
    55
  );
}

// 마지막 엔딩 화면
function drawEnding() {

  drawImage(
    'ending',
    0,
    0,
    width,
    height
  );

  imageMode(CENTER);

  // 첫 번째: 주인공
  if (endingStep === 0) {
    if (
      images.endingPlayer &&
      images.endingPlayer.width > 0
    ) {
      image(
        images.endingPlayer,
        210,
        330,
        330,
        460
      );
    }
  }

  // 두 번째: 선생님
  if (endingStep === 1) {
    if (
      images.endingTeacher &&
      images.endingTeacher.width > 0
    ) {
      image(
        images.endingTeacher,
        210,
        330,
        330,
        460
      );
    }
  }

  imageMode(CORNER);

  // 반투명 말풍선
  noStroke();
  fill(255, 180);

  rect(
    40,
    280,
    764,
    170,
    25
  );

  let currentMessage =
    endingStep === 0
      ? END_PLAYER
      : END_TEACHER;

  // 글자 한 글자씩 출력
  if (
    frameCount % 3 === 0 &&
    speechIndex < currentMessage.length
  ) {
    speech += currentMessage.charAt(speechIndex);
    speechIndex++;
  }

  fill(0);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(28);

  text(
    speech,
    80,
    320,
    680,
    100
  );

  if (speechIndex >= currentMessage.length) {
    drawNextButton();
  }
}

// 마지막 끝 화면
function drawEnd() {
  background(0);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(120);
  fill(255, 0, 0);

  text(
    '끝',
    width / 2,
    height / 2 - 50
  );

  drawButton(
    '처음부터 다시하기',
    width / 2 - 130,
    282,
    260,
    55
  );
}

// ======================================
// 모든 화면의 클릭 처리
// ======================================


function handleClick(x, y) {

  // 동물 관찰 노트 읽는 화면
  if (state === 'animalNotebook') {
    return clickAnimalNotebook(x, y);
  }

  // 교실에 있는 노트 클릭
  if (
    state === 'classroom' &&
    x >= 590 && x <= 690 &&
    y >= 320 && y <= 420
  ) {
    animalNotebookPage = 0;
    animalNotebookReturnState = state;
    setState('animalNotebook');
    return false;
  }

  if (state === 'ghostQuiz') {
    return clickGhostQuiz(x, y);
  }

  if (state === 'ghostOver') {
    return clickGhostOver(x, y);
  }

  // 1층 로비 조작
  if (state === 'lobbyFinal') {
    return clickLobbyFinal(x, y);
  }

  // 학교 정문 연출
  if (state === 'frontDoorFinal') {
    return clickFrontDoorFinal(x, y);
  }

  // 첫 번째 계단 장면
  if (state === 'stairBefore') {
    if (
      speechIndex >= STAIR_BEFORE.length &&
      hit(x, y, width - 150, 390, 100, 45)
    ) {
      resetSpeech();
      setState('corridor4');
    }
    return false;
  }

  // 두 번째 계단 장면
  if (state === 'stairAfter') {
    if (
      speechIndex >= STAIR_AFTER.length &&
      x >= width - 150 &&
      x <= width - 50 &&
      y >= 390 &&
      y <= 435
    ) {
      resetSpeech();
      resetFloor3();
      setState('floor3');
    }

    return false;
  }

  // 3층 쪽지 찾기
  if (state === 'floor3') {
    return handleFloor3Click(x, y);
  }

  // 쪽지 읽기
  if (state === 'floor3Note') {
    return handleFloor3NoteClick(x, y);
  }

  // 비밀번호 입력
  if (state === 'floor3Keypad') {
    return handleFloor3KeypadClick(x, y);
  }

  // 3층 탈출 성공
  if (state === 'floor3Win') {
    if (hit(x, y, 310, 345, 224, 58)) {
      startObstacleStage();
    }
    return false;
  }

  // 1. 게임 시작
  if (state === 'title') {
    if (
      hit(x, y, width / 2 - 110, 325, 220, 60)
    ) {
      storyIndex = 0;
      setState('story');
    }

    return false;
  }

  // 2. 스토리 넘기기
  if (state === 'story') {
    storyIndex++;

    if (storyIndex >= STORY.length) {
      player.x = 100;
      player.y = 300;
      setState('classroom');
    }

    return false;
  }

  // 3. 교실 이동
  if (state === 'classroom') {
    // 방향 버튼은 누르고 있는 동안 이동
    return false;
  }

  // 4. 사물함 게임
  if (state === 'corridor4') {

    // 이동 버튼을 누른 경우
    for (const key in PAD) {
      const b = PAD[key];

      if (hit(x, y, b.x, b.y, b.w, b.h)) {
        return false;
      }
    }

    if (selectLocker(x, y)) {
      return false;
    }

    if (selectNpc(x, y)) {
      return false;
    }

    return false;
  }

  // 5. NPC 대사
  if (state === 'npcTalk') {
    dialogueIndex++;

    if (dialogueIndex >= NPC_LINES.length) {
      dialogueIndex = 0;
      setState('corridor4');
    }

    return false;
  }

  // 6. 사물함 게임오버
  if (state === 'lockerOver') {
    if (
      hit(x, y, width / 2 - 140, 415, 280, 55)
    ) {
      restartLockerStage();
    }

    return false;
  }

  // 7. 중간 주인공 대사
  if (state === 'interlude') {
    if (
      speechIndex >= INTERLUDE.length &&
      hit(x, y, width - 150, 390, 100, 45)
    ) {
      startObstacleStage();
    }

    return false;
  }

  // 8. 장애물 게임
  if (state === 'obstacle') {
    if (hit(x, y, 20, 400, 80, 80)) {
      player.x -= 80;
    }

    if (hit(x, y, 744, 400, 80, 80)) {
      player.x += 80;
    }

    player.x = constrain(
      player.x,
      40,
      804
    );

    return false;
  }

  // 9. 장애물 게임오버
  if (state === 'obstacleOver') {
    if (
      gameOverAlpha > 180 &&
      hit(x, y, width / 2 - 110, 370, 220, 55)
    ) {
      restartObstacleStage();
    }

    return false;
  }

  // 10. 탈출 성공
  if (state === 'success') {
    if (
      hit(x, y, width / 2 - 110, 250, 220, 55)
    ) {
      resetLobbyFinal();
      setState('lobbyFinal');
    }

    return false;
  }

  // 11. 마지막 엔딩
  if (state === 'ending') {
    let currentMessage =
      endingStep === 0
        ? END_PLAYER
        : END_TEACHER;

    if (
      speechIndex >= currentMessage.length &&
      hit(x, y, width - 150, 390, 100, 45)
    ) {
      if (endingStep === 0) {
        endingStep = 1;
        resetSpeech();
      } else {
        setState('end');
      }
    }

    return false;
  }

  // 12. 마지막 끝 화면
  if (state === 'end') {
    if (
      hit(x, y, width / 2 - 130, 282, 260, 55)
    ) {
      resetAll();
    }

    return false;
  }

  return false;
}


// ======================================
// 노트북 + 아이패드 터치 통합
// ======================================

// 화면에 표시된 캔버스 크기에 맞춰
// 클릭 위치를 게임 좌표로 변환
function getGamePosition(clientX, clientY) {

  const canvas = document.querySelector('canvas');

  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return null;
  }

  return {
    x: (clientX - rect.left) * width / rect.width,
    y: (clientY - rect.top) * height / rect.height
  };
}

// 마우스나 터치 위치를 저장
function updatePointer(x, y) {
  pointerX = x;
  pointerY = y;
}

// 컴퓨터 마우스 클릭
function mousePressed(event) {

  // 아이패드 터치 후 발생하는
  // 중복 마우스 클릭 방지
  if (millis() - lastTouchTime < 700) {
    return false;
  }

  let pos = null;

  if (
    event &&
    typeof event.clientX === 'number'
  ) {
    pos = getGamePosition(
      event.clientX,
      event.clientY
    );
  }

  if (!pos) {
    pos = {
      x: mouseX,
      y: mouseY
    };
  }

  pointerHeld = true;
  updatePointer(pos.x, pos.y);

  handleClick(pos.x, pos.y);

  return false;
}

// 마우스를 누른 채 움직이기
function mouseDragged(event) {

  if (millis() - lastTouchTime < 700) {
    return false;
  }

  let pos = null;

  if (
    event &&
    typeof event.clientX === 'number'
  ) {
    pos = getGamePosition(
      event.clientX,
      event.clientY
    );
  }

  if (pos) {
    updatePointer(pos.x, pos.y);
  } else {
    updatePointer(mouseX, mouseY);
  }

  return false;
}

// 마우스 놓기
function mouseReleased() {
  pointerHeld = false;
  return false;
}

// 아이패드 터치 시작
function touchStarted(event) {

  lastTouchTime = millis();

  let pos = null;

  // 실제 터치 좌표 사용
  if (
    event &&
    event.changedTouches &&
    event.changedTouches.length > 0
  ) {
    const touch = event.changedTouches[0];

    pos = getGamePosition(
      touch.clientX,
      touch.clientY
    );
  }

  // p5.js 좌표로 대체
  if (!pos && touches.length > 0) {
    pos = {
      x: touches[0].x,
      y: touches[0].y
    };
  }

  if (pos) {
    pointerHeld = true;
    updatePointer(pos.x, pos.y);

    handleClick(pos.x, pos.y);
  }

  return false;
}

// 아이패드에서 손가락 이동
function touchMoved(event) {

  let pos = null;

  if (
    event &&
    event.touches &&
    event.touches.length > 0
  ) {
    const touch = event.touches[0];

    pos = getGamePosition(
      touch.clientX,
      touch.clientY
    );
  }

  if (!pos && touches.length > 0) {
    pos = {
      x: touches[0].x,
      y: touches[0].y
    };
  }

  if (pos) {
    pointerHeld = true;
    updatePointer(pos.x, pos.y);
  }

  return false;
}

// 아이패드에서 손가락 떼기
function touchEnded() {
  pointerHeld = false;
  return false;
}

// 키보드 방향키 스크롤 방지
function keyPressed() {

  // 1층 로비에서 E키로 문 열기
  if (
    state === 'lobbyFinal' &&
    (key === 'e' || key === 'E' || key === ' ')
  ) {
    lobbyFinalTryDoor();
    return false;
  }

  if (
    keyCode === LEFT_ARROW ||
    keyCode === RIGHT_ARROW ||
    keyCode === UP_ARROW ||
    keyCode === DOWN_ARROW
  ) {
    return false;
  }
}


// ======================================
// 계단 스토리 장면
// ======================================


const STAIR_BEFORE =
  '(뚜벅뚜벅) 뭔가가 나올 것 같아....';

const STAIR_AFTER =
  '아마 이쪽으로 가야할거야';

function drawStairScene() {

  // 계단 배경
  drawImage('stairs', 0, 0, width, height);

  // 주인공 이미지
  imageMode(CENTER);

  if (images.endingPlayer &&
      images.endingPlayer.width > 0) {
    image(
      images.endingPlayer,
      210, 330, 330, 460
    );
  }

  imageMode(CORNER);

  // 엔딩과 같은 반투명 말풍선
  noStroke();
  fill(255, 180);
  rect(40, 280, 764, 170, 25);

  // 현재 장면 대사
  let message =
    state === 'stairBefore'
      ? STAIR_BEFORE
      : STAIR_AFTER;

  // 한 글자씩 출력
  if (
    frameCount % 3 === 0 &&
    speechIndex < message.length
  ) {
    speech += message.charAt(speechIndex);
    speechIndex++;
  }

  fill(0);
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(28);

  text(speech, 80, 320, 680, 100);

  // 대사가 끝나면 다음 버튼
  if (speechIndex >= message.length) {
    drawNextButton();
  }
}

// ======================================
// 3층 미니게임 1/2
// 숨겨진 쪽지 4장 찾기
// ======================================

// 비밀번호
const FLOOR3_PASSWORD = '3742';

// 쪽지 위치와 힌트
const FLOOR3_NOTES = [
  {
    x: 350,
    y: 174,
    name: '게시판',
    clue: '첫 번째 숫자',
    text: '문어의 심장은 아가미 심장과 체심장을 포함해 총 몇개의 심장이 있을까?'
  },
  {
    x: 135,
    y: 328,
    name: '화분',
    clue: '두 번째 숫자',
    text: '일주일은 며칠일까?'
  },
  {
    x: 350,
    y: 355,
    name: '책장',
    clue: '세 번째 숫자',
    text: '소는 위가 몇개일까?'
  },
  {
    x: 653,
    y: 235,
    name: '사물함',
    clue: '네 번째 숫자',
    text: '사람의 눈은 보통 몇 개일까?'
  }
];

// 쪽지 발견 여부
let floor3Found = [false, false, false, false];

// 현재 열어 본 쪽지
let floor3OpenNote = -1;

// 비밀번호 입력값
let floor3Input = '';

// 틀렸을 때 메시지 표시 시간
let floor3ErrorUntil = 0;

// 3층 게임 초기화
function resetFloor3() {
  floor3Found = [false, false, false, false];
  floor3OpenNote = -1;
  floor3Input = '';
  floor3ErrorUntil = 0;
}

// ======================================
// 3층 메인 화면
// ======================================

function drawFloor3() {

  // 언냐가 보내준 3층 배경
  drawImage('floor3', 0, 0, width, height);

  // 위쪽 안내창
  noStroke();
  fill(0, 205);
  rect(0, 0, width, 58);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(20);

  text(
    '3층 | 숨겨진 쪽지 4장을 찾아 비밀번호를 알아내자',
    width / 2,
    19
  );

  textSize(15);
  textStyle(NORMAL);

  text(
    '찾은 쪽지: ' +
    floor3Found.filter(Boolean).length +
    ' / 4',
    width / 2,
    44
  );

  // 숨겨진 쪽지 표시
  for (let i = 0; i < FLOOR3_NOTES.length; i++) {

    const note = FLOOR3_NOTES[i];

    push();

    translate(note.x, note.y);
    rotate(i % 2 ? -0.09 : 0.07);

    stroke(90, 66, 34);
    strokeWeight(2);

    // 발견한 쪽지는 연두색
    fill(
      floor3Found[i]
        ? '#b7d4b8'
        : '#f3dda1'
    );

    rectMode(CENTER);
    rect(0, 0, 34, 28, 3);

    noStroke();
    fill(80, 55, 35);

    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);

    text(
      floor3Found[i] ? '✓' : '?',
      0,
      0
    );

    pop();
  }

  rectMode(CORNER);

  // 비밀번호 입력 버튼
  drawButton(
    '비밀번호 입력 🔐',
    625,
    432,
    198,
    52
  );

  // 쪽지를 전부 찾으면 안내
  if (floor3Found.every(Boolean)) {

    fill(255, 235, 145);
    textAlign(CENTER, CENTER);
    textSize(16);

    text(
      '쪽지를 모두 찾았다! 비밀번호를 입력하자.',
      410,
      406
    );
  }
}

// ======================================
// 쪽지 클릭하기
// ======================================

function handleFloor3Click(x, y) {

  // 비밀번호 입력 버튼
  if (hit(x, y, 625, 432, 198, 52)) {

    floor3Input = '';
    setState('floor3Keypad');

    return false;
  }

  // 쪽지 클릭 판정
  for (let i = 0; i < FLOOR3_NOTES.length; i++) {

    const n = FLOOR3_NOTES[i];

    if (
      hit(
        x,
        y,
        n.x - 25,
        n.y - 25,
        50,
        50
      )
    ) {

      floor3Found[i] = true;
      floor3OpenNote = i;

      setState('floor3Note');

      return false;
    }
  }

  return false;
}

// ======================================
// 쪽지 읽기 화면
// ======================================

function drawFloor3Note() {

  // 배경 어둡게
  noStroke();
  fill(0, 185);
  rect(0, 0, width, height);

  // 커다란 종이
  fill('#f1dfb3');
  stroke('#a58a59');
  strokeWeight(3);

  rect(160, 105, 524, 288, 8);

  noStroke();
  fill('#493922');

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(25);

  const n = FLOOR3_NOTES[floor3OpenNote];

  text(
    '[' + n.name + '] ' + n.clue,
    width / 2,
    157
  );

  textStyle(NORMAL);
  textSize(20);

  // 종이 안쪽에 글씨 배치
  textAlign(CENTER, CENTER);

  text(
    n.text,
    215,
    205,
    414,
    90
  );

  // 쪽지 닫기 버튼
  drawButton(
    '쪽지 접기',
    340,
    325,
    164,
    50
  );
}

// ======================================
// 쪽지 닫기
// ======================================

function handleFloor3NoteClick(x, y) {

  if (
    hit(x, y, 340, 325, 164, 50) ||
    !hit(x, y, 160, 105, 524, 288)
  ) {

    floor3OpenNote = -1;
    setState('floor3');
  }

  return false;
}


// ======================================
// 3층 미니게임 2/2
// 비밀번호 키패드 + 성공 화면
// ======================================

// 키패드 숫자 버튼의 위치
// 원본 이미지 크기: 1663 x 920
// 캔버스에 전체 화면으로 표시하는 기준
const FLOOR3_KEY_BUTTONS = [
  { key: '1', x: 714, y: 362 },
  { key: '2', x: 831, y: 362 },
  { key: '3', x: 950, y: 362 },

  { key: '4', x: 714, y: 464 },
  { key: '5', x: 831, y: 464 },
  { key: '6', x: 950, y: 464 },

  { key: '7', x: 714, y: 565 },
  { key: '8', x: 831, y: 565 },
  { key: '9', x: 950, y: 565 },

  { key: 'C', x: 714, y: 669 },
  { key: '0', x: 831, y: 669 },
  { key: 'BACK', x: 950, y: 669 }
];

// 이미지 원본 기준 버튼 크기
const FLOOR3_KEY_W = 100;
const FLOOR3_KEY_H = 85;

// ======================================
// 비밀번호 입력 화면
// ======================================

function drawFloor3Keypad() {

  background(0);

  // 키패드 배경 이미지
  drawImage(
    'keypad',
    0,
    0,
    width,
    height
  );

  // 상단 안내
  noStroke();
  fill(0, 195);
  rect(0, 0, width, 60);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(21);

  text(
    '3층 | 잠긴 문을 열어라',
    width / 2,
    22
  );

  textStyle(NORMAL);
  textSize(14);

  text(
    '숫자 4자리를 입력하세요',
    width / 2,
    47
  );

  // 비밀번호 입력 표시
  // 원본 이미지의 **** 표시 부분 위에 출력
  const displayX = 422;
  const displayY = 133;

  noStroke();
  fill(10, 16, 21);

  rect(
    345,
    111,
    154,
    44,
    5
  );

  fill(235);
  textAlign(CENTER, CENTER);
  textSize(27);
  textStyle(BOLD);

  let masked = '';

  for (let i = 0; i < 4; i++) {
    masked += i < floor3Input.length
      ? '● '
      : '– ';
  }

  text(
    masked,
    displayX,
    displayY
  );

  // 잘못 입력했을 때 경고
  if (millis() < floor3ErrorUntil) {

    noStroke();
    fill(120, 0, 0, 230);

    rect(
      210,
      405,
      424,
      55,
      10
    );

    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(19);

    text(
      '비밀번호가 틀렸습니다!',
      width / 2,
      432
    );
  }

  // 돌아가기 버튼
  drawButton(
    '← 3층으로',
    20,
    425,
    155,
    52
  );

  // 입력한 숫자 개수 표시
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(NORMAL);
  textSize(16);

  text(
    floor3Input.length + ' / 4',
    750,
    452
  );
}

// ======================================
// 키패드 버튼 클릭 판정
// ======================================

function handleFloor3KeypadClick(x, y) {

  // 돌아가기 버튼
  if (hit(x, y, 20, 425, 155, 52)) {

    floor3Input = '';
    setState('floor3');

    return false;
  }

  // 실제 이미지 비율에 맞춰 좌표 변환
  const imageX = x * 1663 / width;
  const imageY = y * 920 / height;

  // 숫자 버튼 확인
  for (const button of FLOOR3_KEY_BUTTONS) {

    const bx = button.x - FLOOR3_KEY_W / 2;
    const by = button.y - FLOOR3_KEY_H / 2;

    if (
      hit(
        imageX,
        imageY,
        bx,
        by,
        FLOOR3_KEY_W,
        FLOOR3_KEY_H
      )
    ) {

      pressFloor3Key(button.key);

      return false;
    }
  }

  return false;
}

// ======================================
// 키패드 숫자 입력 처리
// ======================================

function pressFloor3Key(key) {

  // 전체 삭제
  if (key === 'C') {

    floor3Input = '';
    return;
  }

  // 한 자리 삭제
  if (key === 'BACK') {

    floor3Input = floor3Input.slice(0, -1);
    return;
  }

  // 숫자는 최대 4자리
  if (floor3Input.length >= 4) {
    return;
  }

  floor3Input += key;

  // 4자리 입력하면 자동 확인
  if (floor3Input.length === 4) {

    if (floor3Input === FLOOR3_PASSWORD) {

      // 쪽지 4장을 모두 찾아야 성공
      if (floor3Found.every(Boolean)) {

        setState('floor3Win');

      } else {

        floor3Input = '';
        floor3ErrorUntil = millis() + 1700;
      }

    } else {

      // 틀린 비밀번호
      floor3Input = '';
      floor3ErrorUntil = millis() + 1700;
    }
  }
}


function drawFloor3Win() {

  background(0);

  // 성공 표시
  fill(255, 220, 100);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(45);

  text(
    '철컥!',
    width / 2,
    145
  );

  fill(255);
  textSize(30);

  text(
    '잠겨 있던 문이 열렸다!',
    width / 2,
    220
  );

  textStyle(NORMAL);
  textSize(20);

  text(
    '이제 2층으로 내려가자.',
    width / 2,
    282
  );

  // 2층 이동 버튼
  drawButton(
    '2층으로 이동 →',
    310,
    345,
    224,
    58
  );
}


////////////////////////////////////////////////
// 1층 로비 + 정문 + 엔딩 연결
////////////////////////////////////////////////

let lobbyFinalX = 105;
let lobbyFinalDoorOpen = false;
let lobbyFinalDoorAt = 0;
let lobbyFinalMessage = '';
let lobbyFinalMessageUntil = 0;
let lobbyFinalArrivedAt = 0;


function resetLobbyFinal() {
  lobbyFinalX = 105;
  lobbyFinalDoorOpen = false;
  lobbyFinalDoorAt = 0;
  lobbyFinalMessage = '';
  lobbyFinalMessageUntil = 0;
  lobbyFinalArrivedAt = 0;

  // 귀신 소녀 상태
  ghostAppearedAt = millis();
  ghostQuizCleared = false;
  ghostQuizStarted = false;
}

// 안내 메시지
function lobbyFinalNotice(msg) {
  lobbyFinalMessage = msg;
  lobbyFinalMessageUntil = millis() + 1900;
}

// 버튼 클릭 판정
function lobbyFinalInButton(x, y, bx, by, bw, bh) {
  return (
    x >= bx &&
    x <= bx + bw &&
    y >= by &&
    y <= by + bh
  );
}

// 주인공 그리기
function lobbyFinalDrawPlayer(x, y) {
  push();
  imageMode(CENTER);

  if (images.player && images.player.width > 0) {
    image(images.player, x, y - 24, 57, 100);
  } else {
    noStroke();

    fill(0, 0, 0, 100);
    ellipse(x, y + 10, 48, 13);

    fill(40, 48, 65);
    rect(x - 12, y - 27, 24, 36);

    fill(223, 184, 154);
    ellipse(x, y - 40, 25, 27);

    fill(25);
    arc(x, y - 46, 27, 22, PI, TWO_PI);
  }

  pop();
}

// 상단 안내창
function lobbyFinalPanel(title, hint) {
  noStroke();

  fill(0, 0, 0, 190);
  rect(12, 12, 440, 67, 9);

  fill(255);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(20);
  text(title, 26, 35);

  textStyle(NORMAL);
  textSize(13);
  fill(230);
  text(hint, 26, 60);
}

// 이동 및 문 열기 버튼
function lobbyFinalControls() {
  noStroke();

  fill(0, 0, 0, 195);
  rect(20, 419, 73, 66, 11);
  rect(105, 419, 73, 66, 11);
  rect(653, 419, 173, 66, 11);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  textSize(26);
  text('◀', 56, 451);
  text('▶', 141, 451);

  textSize(18);
  text('문 열기 E', 739, 451);
}

// 키보드 및 터치 이동
function lobbyFinalMoving(direction) {
  const pointer = pointerHeld && (
    direction < 0
      ? lobbyFinalInButton(
          pointerX, pointerY, 20, 419, 73, 66
        )
      : lobbyFinalInButton(
          pointerX, pointerY, 105, 419, 73, 66
        )
  );

  const keyboard = direction < 0
    ? keyIsDown(LEFT_ARROW) || keyIsDown(65)
    : keyIsDown(RIGHT_ARROW) || keyIsDown(68);

  return pointer || keyboard;
}

// ======================================
// 1층 로비 화면
// ======================================


function drawLobbyFinal() {

  // 1층 로비 배경
  drawImage('lobby1', 0, 0, width, height);

  // 주인공 이동
  if (lobbyFinalMoving(-1)) {
    lobbyFinalX -= 3.7;
  }

  if (lobbyFinalMoving(1)) {
    lobbyFinalX += 3.7;
  }

  lobbyFinalX = constrain(lobbyFinalX, 35, 805);

  // 정문 앞에 나타나는 귀신 소녀
  if (!ghostQuizCleared) {

    // 2초 동안 서서히 나타남
    const ghostAlpha = constrain(
      (millis() - ghostAppearedAt) / 2000,
      0,
      1
    );

    push();
    tint(255, 255 * ghostAlpha);

    if (images.ghostGirl) {
      image(
        images.ghostGirl,
        605,
        160,
        160,
        235
      );
    }

    pop();

    // 소녀에게 가까이 가면 퀴즈 시작
    if (
      lobbyFinalX >= 545 &&
      ghostAlpha >= 1 &&
      !ghostQuizStarted
    ) {
      ghostQuizStarted = true;
      setState('ghostQuiz');
      return;
    }
  }

  // 주인공 표시
  lobbyFinalDrawPlayer(lobbyFinalX, 385);

  // 안내 문구
  lobbyFinalPanel(
    '1층 | 학교 로비',
    ghostQuizCleared
      ? '이제 정문을 열 수 있다.'
      : '정문 앞에 누군가 서 있다...'
  );

  // 이동 버튼 표시
  lobbyFinalControls();

  // 안내 메시지
  if (millis() < lobbyFinalMessageUntil) {

    noStroke();
    fill(0, 0, 0, 220);
    rect(218, 333, 408, 55, 9);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(17);

    text(lobbyFinalMessage, 422, 360);
  }

  // 정문이 열리면 다음 장면으로
  if (
    lobbyFinalDoorOpen &&
    millis() - lobbyFinalDoorAt > 650
  ) {
    lobbyFinalArrivedAt = millis();
    setState('frontDoorFinal');
  }
}


// ======================================
// 정문 열기
// ======================================


function lobbyFinalTryDoor() {

  if (lobbyFinalDoorOpen) return;

  // 귀신 퀴즈를 풀지 않았다면
  if (!ghostQuizCleared) {

    lobbyFinalNotice(
      '소녀의 문제를 풀어야 문을 열 수 있다...'
    );

    return;
  }

  // 문과의 거리 확인
  if (lobbyFinalX < 605) {

    lobbyFinalNotice(
      '정문에 조금 더 가까이 가자!'
    );

    return;
  }

  // 문 열기 성공
  lobbyFinalDoorOpen = true;
  lobbyFinalDoorAt = millis();

  lobbyFinalNotice(
    '철컥... 드디어 정문이 열렸습니다!'
  );
}


function clickLobbyFinal(x, y) {

  // 문 열기 버튼
  if (
    lobbyFinalInButton(
      x, y,
      653, 419,
      173, 66
    )
  ) {
    lobbyFinalTryDoor();
    return false;
  }

  // 정문 직접 클릭
  if (
    x > 620 &&
    y > 140 &&
    y < 415
  ) {
    lobbyFinalTryDoor();
    return false;
  }

  return false;
}


// ======================================
// 학교 정문 연출
// ======================================

function drawFrontDoorFinal() {

  // 언냐가 보내준 정문 사진
  drawImage('frontDoor', 0, 0, width, height);

  const elapsed = millis() - lobbyFinalArrivedAt;

  lobbyFinalPanel(
    '학교 정문',
    '마지막 문을 열면 학교 밖이다.'
  );

  // 문 사이에서 빛이 퍼지는 연출
  if (elapsed > 700) {
    const gap = constrain(
      (elapsed - 700) / 1400,
      0,
      1
    );

    noStroke();

    fill(220, 234, 241, 150 * gap);

    rect(
      width / 2 - 3 - gap * 42,
      60,
      6 + gap * 84,
      380
    );

    fill(235, 241, 250, 165 * gap);
    rect(0, 0, width, height);
  }

  // 기존 엔딩으로 이동
  if (elapsed > 2350) {
    endingStep = 0;
    resetSpeech();
    setState('ending');
  }
}

// 정문 연출 중 중복 클릭 방지
function clickFrontDoorFinal(x, y) {
  return false;
}


// ======================================
// 귀신 소녀 상태 변수
// ======================================

let ghostAppearedAt = 0;
let ghostQuizCleared = false;
let ghostQuizStarted = false;


////////////////////////////////////////////////
// 귀신 소녀 최종 퀴즈 + GAME OVER
////////////////////////////////////////////////

// 퀴즈 내용
const GHOST_QUESTION =
  '다음 중 알을 낳는 포유류는 무엇일까?';

const GHOST_OPTIONS = [
  '1. 주머니두더지',
  '2. 오리너구리',
  '3. 캥거루',
  '4. 코알라',
  '5. 웜뱃'
];

// 정답: 2번
const GHOST_ANSWER = 1;

// GAME OVER가 시작된 시간
let ghostOverAt = 0;

// 퀴즈 선택지 위치
function ghostOptionBox(i) {
  return {
    x: 187,
    y: 178 + i * 53,
    w: 470,
    h: 45
  };
}

// ======================================
// 귀신 소녀 퀴즈 화면
// ======================================

function drawGhostQuiz() {

  // 학교 로비 배경
  drawImage('lobby1', 0, 0, width, height);

  // 배경 어둡게
  noStroke();
  fill(0, 0, 0, 170);
  rect(0, 0, width, height);

  // 귀신 소녀
  if (images.ghostGirl) {
    image(
      images.ghostGirl,
      16,
      113,
      175,
      270
    );
  }

  // 퀴즈 판
  fill(13, 19, 33, 238);
  stroke(126, 151, 184);
  strokeWeight(2);
  rect(174, 48, 496, 430, 14);

  noStroke();

  // 제목
  fill(196, 218, 255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(25);
  text('마지막 관문', 422, 84);

  // 귀신 대사
  fill(240);
  textStyle(NORMAL);
  textSize(16);
  text(
    '내 문제를 맞히면 보내줄게...',
    422,
    117
  );

  // 문제
  fill(255, 232, 175);
  textStyle(BOLD);
  textSize(18);
  text(
    GHOST_QUESTION,
    422,
    150
  );

  // 5개 선택지
  for (let i = 0; i < 5; i++) {

    const b = ghostOptionBox(i);

    stroke(105, 132, 170);
    strokeWeight(1);

    fill(36, 48, 70);
    rect(
      b.x,
      b.y,
      b.w,
      b.h,
      8
    );

    noStroke();
    fill(255);

    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    textSize(17);

    text(
      GHOST_OPTIONS[i],
      b.x + 19,
      b.y + b.h / 2
    );
  }
}

// ======================================
// 퀴즈 정답 클릭 처리
// ======================================

function clickGhostQuiz(x, y) {

  for (let i = 0; i < 5; i++) {

    const b = ghostOptionBox(i);

    if (
      x >= b.x &&
      x <= b.x + b.w &&
      y >= b.y &&
      y <= b.y + b.h
    ) {

      if (i === GHOST_ANSWER) {

        // 정답! 귀신이 사라짐
        ghostQuizCleared = true;
        ghostQuizStarted = false;

        lobbyFinalNotice(
          '정답이야... 이제 가도 좋아.'
        );

        setState('lobbyFinal');

      } else {

        // 오답! GAME OVER
        ghostOverAt = millis();
        setState('ghostOver');
      }

      return false;
    }
  }

  return false;
}

// ======================================
// GAME OVER 화면
// ======================================

function drawGhostOver() {

  background(0);

  // 무서운 귀신 사진
  if (images.ghostScare) {

    imageMode(CENTER);

    // 등장하면서 커지는 연출
    const elapsed = millis() - ghostOverAt;

    const size = constrain(
      340 + elapsed * 0.14,
      340,
      500
    );

    image(
      images.ghostScare,
      width / 2,
      220,
      size,
      size
    );

    imageMode(CORNER);
  }

  // 어두운 하단
  noStroke();
  fill(0, 0, 0, 205);
  rect(0, 342, width, 158);

  // GAME OVER
  fill(255, 65, 75);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(48);
  text('GAME OVER', width / 2, 375);

  // 다시하기 버튼
  stroke(255);
  strokeWeight(2);
  fill(38, 42, 57);
  rect(310, 420, 224, 58, 10);

  noStroke();
  fill(255);
  textSize(23);
  text('다시하기', 422, 449);
}

// ======================================
// GAME OVER 다시하기
// ======================================

function clickGhostOver(x, y) {

  if (
    x >= 310 &&
    x <= 534 &&
    y >= 420 &&
    y <= 478
  ) {

    // 1층 로비에서 다시 도전
    resetLobbyFinal();

    // 귀신 근처에서 다시 시작
    lobbyFinalX = 500;

    setState('lobbyFinal');
  }

  return false;
}




// ======================================
// 동물 관찰 노트 - 총 4쪽
// ======================================

let animalNotebookPage = 0;
let animalNotebookReturnState = 'classroom';

const ANIMAL_NOTEBOOK = [
  {
    title: '소',
    lines: [
      '소는 거의 330도까지 볼 수 있다.',
      '소도 문제를 해결하면 신나한다.',
      '소는 위가 4개의 방으로 나뉘어 있다.'
    ]
  },
  {
    title: '문어',
    lines: [
      '문어의 피는 파란색이다.',
      '문어는 심장이 3개나 있다.',
      '문어의 팔은 스스로 판단할 수 있다.'
    ]
  },
  {
    title: '오리너구리',
    lines: [
      '오리너구리는 포유류인데 알을 낳는다.',
      '오리너구리는 눈을 감고도 먹이를 찾는다.',
      '오리너구리는 자외선을 비추면 몸이 빛난다.'
    ]
  },
  {
    title: '사자',
    lines: [
      '사자는 하루에 최대 20시간을 쉰다.',
      '사자는 암사자가 주로 사냥한다.',
      '사자의 포효는 약 8km 밖에서도 들린다.'
    ]
  }
];

// 교실의 노트 아이콘

function drawAnimalNotebookIcon() {
  push();

  imageMode(CENTER);

  // 교실에 놓인 책 이미지
  if (images.book && images.book.width > 0) {
    image(
      images.book,
      640, 365,
      110, 110
    );
  }

  pop();
}


// 노트 읽는 화면
function drawAnimalNotebook() {
  background('#1b1c26');

  // 책 그림자
  noStroke();
  fill(0, 120);
  rect(102, 56, 640, 390, 16);

  // 낡은 종이
  fill('#ead9ad');
  stroke('#8d7250');
  strokeWeight(4);
  rect(95, 47, 654, 394, 12);

  // 왼쪽 제본
  noStroke();
  fill('#b39a70');
  rect(112, 64, 18, 356, 5);

  // 종이 줄무늬
  stroke(171, 151, 116, 85);
  strokeWeight(1);

  for (let y = 190; y <= 350; y += 42) {
    line(158, y, 693, y);
  }

  const page = ANIMAL_NOTEBOOK[animalNotebookPage];

  noStroke();
  fill('#4b3928');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(27);

  text(
    '동물 관찰 노트',
    width / 2,
    92
  );

  textSize(19);
  text(
    (animalNotebookPage + 1) +
    '쪽 - ' + page.title,
    width / 2,
    138
  );

  // 본문
  textAlign(LEFT, TOP);
  textStyle(NORMAL);
  textSize(20);
  textLeading(30);

  for (let i = 0; i < page.lines.length; i++) {
    text(
      '• ' + page.lines[i],
      164,
      185 + i * 58,
      520,
      55
    );
  }

  // 이전 페이지
  if (animalNotebookPage > 0) {
    drawAnimalNoteButton('◀ 이전', 155, 374, 125, 46);
  }

  // 다음 페이지
  if (animalNotebookPage < 3) {
    drawAnimalNoteButton('다음 ▶', 562, 374, 125, 46);
  }

  // 책 덮기
  drawAnimalNoteButton('책 덮기', 353, 374, 138, 46);
}

// 노트 버튼
function drawAnimalNoteButton(label, x, y, w, h) {
  noStroke();
  fill('#68513b');
  rect(x, y, w, h, 7);

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(17);
  text(label, x + w / 2, y + h / 2);
}

// 노트 클릭
function clickAnimalNotebook(x, y) {

  // 이전 페이지
  if (
    animalNotebookPage > 0 &&
    x >= 155 && x <= 280 &&
    y >= 374 && y <= 420
  ) {
    animalNotebookPage--;
    return false;
  }

  // 다음 페이지
  if (
    animalNotebookPage < 3 &&
    x >= 562 && x <= 687 &&
    y >= 374 && y <= 420
  ) {
    animalNotebookPage++;
    return false;
  }

  // 책 덮기
  if (
    x >= 353 && x <= 491 &&
    y >= 374 && y <= 420
  ) {
    setState(animalNotebookReturnState);
    return false;
  }

  return false;
}
