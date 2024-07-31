const socket = io('http://127.0.0.1:8081');

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
// 카메라 초기 위치 설정
camera.position.set(0, 5, 15);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 마우스 드래그로 부드러운 움직임을 추가
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false; // 카메라의 화면 공간 패닝을 비활성화
controls.minDistance = 2; // 최소 줌 인 거리
controls.maxDistance = 500; // 최대 줌 아웃 거리
controls.maxPolarAngle = Math.PI / 2; // 수직으로 얼마나 회전할 수 있는지를 제한




let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10).normalize();
scene.add(light);

let ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

scene.background = new THREE.Color(0xffffff); // 변경된 배경 색상

// Cannon.js 월드 생성
let world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // 중력 설정
world.defaultContactMaterial.friction = 0.4; // 마찰력 설정
world.defaultContactMaterial.restitution = 0.1; // 반발력 설정

// 바닥 만들기 (Three.js + Cannon.js)
let floorGeometry = new THREE.PlaneGeometry(200, 200);
let floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
let floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

let floorShape = new CANNON.Plane();
let floorBody = new CANNON.Body({ mass: 0 });
floorBody.addShape(floorShape);
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);

// 벽 만들기 (Three.js + Cannon.js)
function createWall(width, height, depth, x, y, z) {
    let wallGeometry = new THREE.BoxGeometry(width, height, depth);
    let wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    let wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    scene.add(wall);

    let wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    let wallBody = new CANNON.Body({ mass: 0 });
    wallBody.addShape(wallShape);
    wallBody.position.set(x, y, z);
    world.addBody(wallBody);
}

// 전시회 벽 배치
createWall(200, 10, 1, 0, 5, -100); // 뒤쪽 벽
createWall(200, 10, 1, 0, 5, 100); // 앞쪽 벽
createWall(1, 10, 200, -100, 5, 0); // 왼쪽 벽
createWall(1, 10, 200, 100, 5, 0); // 오른쪽 벽

// 캐릭터 및 사용자 관리
let users = {};

// 사용자 추가 함수
function addUser(username, model, body) {
    model.scale.set(1, 1, 1);
    model.position.set(0, 1, 0);
    scene.add(model);

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.font = 'Bold 50px Arial';
    context.fillStyle = 'rgba(255,255,255,0.95)';
    context.fillText(username, 0, 50); // 이름 위치 조정

    let texture = new THREE.CanvasTexture(canvas);
    let spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(6, 3, 1); // 스프라이트 크기 조정
    sprite.position.set(0, 3, 0); // 스프라이트 위치 조정

    scene.add(sprite);

    users[username] = { model: model, sprite: sprite, body: body };
}

// 로그인한 사용자 이름 가져오기
const username = localStorage.getItem('username');

// 자신의 캐릭터 추가 (박스 모델)
function addBoxModel(username) {
    let boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    let boxMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    let box = new THREE.Mesh(boxGeometry, boxMaterial);

    let shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    let body = new CANNON.Body({ mass: 1, material: new CANNON.Material({ friction: 0.4, restitution: 0.1 }) });
    body.addShape(shape);
    body.position.set(0, 1, 0);
    world.addBody(body);

    addUser(username, box, body);
}

// 자신의 캐릭터 추가
addBoxModel(username);

// 현재 연결된 모든 사용자 추가
socket.on('user_list', (usernames) => {
    usernames.forEach((user) => {
        if (user !== username) {
            addBoxModel(user);
        }
    });
});

// 다른 사용자 추가
socket.on('user_connected', (data) => {
    if (data.username !== username) {
        addBoxModel(data.username);
    }
});

// 다른 사용자가 떠날 때 처리
socket.on('user_disconnected', (data) => {
   
        let user = users[data.username];
        if (user) {
            scene.remove(user.model);
            scene.remove(user.sprite);
            world.remove(user.body);
            delete users[data.username];
        }
    });

    // 다른 사용자의 위치 업데이트
    socket.on('update_position', (data) => {
        let user = users[data.username];
        if (user) {
            user.model.position.set(data.position.x, data.position.y, data.position.z);
            user.sprite.position.set(data.position.x, data.position.y + 2, data.position.z);
            user.body.position.set(data.position.x, data.position.y, data.position.z);
        }
    });

    socket.on('connect', () => {
        socket.emit('add_user', { username: username });
        socket.emit('connect_display');
        console.log('Connected to server');
    });

    // 카메라 위치 설정
    camera.position.set(0, 5, 15);

    // 키보드 입력 감지
    let keys = {};
    window.addEventListener('keydown', (event) => { keys[event.code] = true; });
    window.addEventListener('keyup', (event) => { keys[event.code] = false; });

    // 캐릭터 이동 함수
    function moveCharacter() {
        let user = users[username];
        let moved = false;
        const speed = 10; // 속도 값을 증가시킴

        user.body.velocity.set(0, 0, 0); // 기존 속도 초기화

        if (keys['ArrowUp']) {
            user.body.velocity.z = -speed; // z 방향으로 이동
            moved = true;
        }
        if (keys['ArrowDown']) {
            user.body.velocity.z = speed; // z 방향으로 이동
            moved = true;
        }
        if (keys['ArrowLeft']) {
            user.body.velocity.x = -speed; // x 방향으로 이동
            moved = true;
        }
        if (keys['ArrowRight']) {
            user.body.velocity.x = speed; // x 방향으로 이동
            moved = true;
        }

        // 스프라이트 위치 업데이트
        user.sprite.position.set(user.model.position.x, user.model.position.y + 2, user.model.position.z);

    

        // 캐릭터가 움직였을 경우 서버에 위치 업데이트 이벤트 전송
        if (moved) {
            socket.emit('update_position', {
                username: username,
                position: {
                    x: user.body.position.x,
                    y: user.body.position.y,
                    z: user.body.position.z
                }
            });
        }

        
    }

    // 애니메이션 루프
   function animate() {
requestAnimationFrame(animate);


// 캐릭터 움직임 업데이트
moveCharacter();

// Cannon.js 월드 업데이트
world.step(1 / 60);

// 모델 위치 업데이트
for (let key in users) {
let user = users[key];
user.model.position.copy(user.body.position);
}
controls.update();

// 카메라가 캐릭터를 따라가도록 설정
let user = users[username];


// 씬 렌더링
renderer.render(scene, camera);
}

    // 창 크기 변경 시 카메라 비율 조정
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
/// 텍스트를 생성하는 함수
function createTextLabel(text, position) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const textGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: 1,
                height: 0.1,
                curveSegments: 12,
            });

            const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

            // 텍스트의 중심을 맞추기 위한 계산
            textGeometry.computeBoundingBox();
            const boundingBox = textGeometry.boundingBox;
            const centerOffset = -0.5 * (boundingBox.max.x - boundingBox.min.x);
            textMesh.position.set(position.x+2 + centerOffset, position.y + 2.5, position.z+1); // y를 조정하여 패널 위에 위치하도록 함

            scene.add(textMesh);
        },
        undefined, // onProgress
        (error) => {
            console.error('An error happened while loading the font.', error);
        }
    );
}

// 패널과 텍스트를 생성하는 함수
function createBoothPanel(booth) {
    const boothGeometry = new THREE.BoxGeometry(5, 5, 1);
    const boothMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const boothMesh = new THREE.Mesh(boothGeometry, boothMaterial);
    boothMesh.position.set(booth.x, booth.y, booth.z);
    scene.add(boothMesh);

    // 부스에 텍스트 추가
    createTextLabel(`${booth.name}\n${booth.description}`, boothMesh.position);

    return boothMesh;
}

// 예시 부스 배열
const booths = [
    { name: 'Booth 1', description: 'Description for booth 2', x: -40, y: 2.5, z: -50 },
    { name: 'Booth 2', description: 'Description for booth 2', x: 10, y: 2.5, z: -50 },
    { name: 'Booth 3', description: 'Description for booth 2', x: 60, y: 2.5, z: -50 },
    { name: 'Booth 4', description: 'Description for booth 2', x: -40, y: 2.5, z: 0 },
    { name: 'Booth 5', description: 'Description for booth 2', x: 10, y: 2.5, z: 0 },
    { name: 'Booth 6', description: 'Description for booth 2', x: 60, y: 2.5, z: 0 },
    { name: 'Booth 7', description: 'Description for booth 2', x: -40, y: 2.5, z: 50 },
    { name: 'Booth 8', description: 'Description for booth 2', x: 10, y: 2.5, z: 50 },
    { name: 'Booth 9', description: 'Description for booth 2', x: 60, y: 2.5, z: 50 },
   
   
   
];

// 부스 생성
booths.forEach(booth => {
    createBoothPanel(booth);
});

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();


    // 채팅 관련 코드 시작
    const chatForm = document.getElementById('message-form');
    const chatInput = document.getElementById('input-message');
    const chatMessages = document.getElementById('chat-messages');

    // 채팅 메시지 받기
    socket.on('chat_message', (data) => {
        appendMessage(data.username, data.message);
    });

    // 메시지 전송
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = chatInput.value;
        if (message) {
            socket.emit('send_message', { username: username, message: message });
            appendMessage(username, message);
            chatInput.value = '';
        }
    });

    // 메시지 추가
    function appendMessage(username, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${username}:</strong> <span class="message-content">${message}</span>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    let door, doorBody;
let isDoorOpen = false; // 초기값을 false로 설정
const openCloseDistance = 3; // 문을 열고 닫을 수 있는 거리 (단위: meters)

// 부스와 문 생성 함수
function createBoothWithDoor(width, height, depth, x, y, z, texturePath, doorWidth, doorHeight, doorDepth) {
const textureLoader = new THREE.TextureLoader();
const wallMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load(texturePath) });

// 부스의 앞벽 생성 (문 공간을 제외한 부분)
const leftWallWidth = (width - doorWidth) / 2;
const rightWallWidth = leftWallWidth;
const frontWallHeight = height;

// 앞벽 왼쪽 부분
const leftFrontWallGeometry = new THREE.BoxGeometry(leftWallWidth, frontWallHeight, 0.1);
const leftFrontWall = new THREE.Mesh(leftFrontWallGeometry, wallMaterial);
leftFrontWall.position.set(x - (width / 2 - leftWallWidth / 2), y, z + depth / 2);
scene.add(leftFrontWall);

// 앞벽 오른쪽 부분
const rightFrontWallGeometry = new THREE.BoxGeometry(rightWallWidth, frontWallHeight, 0.1);
const rightFrontWall = new THREE.Mesh(rightFrontWallGeometry, wallMaterial);
rightFrontWall.position.set(x + (width / 2 - rightWallWidth / 2), y, z + depth / 2);
scene.add(rightFrontWall);

// 부스의 다른 벽 생성 (왼쪽, 오른쪽, 뒷벽)
const wallDepth = 0.1;
const sideWallGeometry = new THREE.BoxGeometry(wallDepth, height, depth);
const backWallGeometry = new THREE.BoxGeometry(width, height, wallDepth);

const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
leftWall.position.set(x - width / 2, y, z);
scene.add(leftWall);

const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
rightWall.position.set(x + width / 2, y, z);
scene.add(rightWall);

const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(x, y, z - depth / 2);
scene.add(backWall);

// 부스의 천장과 바닥 생성
const ceilingFloorGeometry = new THREE.BoxGeometry(width, wallDepth, depth);

const ceiling = new THREE.Mesh(ceilingFloorGeometry, wallMaterial);
ceiling.position.set(x, y + height / 2, z);
scene.add(ceiling);

const floor = new THREE.Mesh(ceilingFloorGeometry, wallMaterial);
floor.position.set(x, y - height / 2, z);
scene.add(floor);

// Cannon.js physics body 생성
const wallBodies = [];

function createWallBody(mesh) {
const shape = new CANNON.Box(new CANNON.Vec3(mesh.geometry.parameters.width / 2, mesh.geometry.parameters.height / 2, mesh.geometry.parameters.depth / 2));
const body = new CANNON.Body({ mass: 0 });
body.addShape(shape);
body.position.copy(mesh.position);
world.addBody(body);
wallBodies.push(body);
}

createWallBody(leftFrontWall);
createWallBody(rightFrontWall);
createWallBody(leftWall);
createWallBody(rightWall);
createWallBody(backWall);
createWallBody(ceiling);
createWallBody(floor);

// 문 생성
const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(x, y, z + depth / 2 + doorDepth / 2);
scene.add(door);

// 문에 대한 Cannon.js physics body 생성
const doorShape = new CANNON.Box(new CANNON.Vec3(doorWidth / 2, doorHeight / 2, doorDepth / 2));
doorBody = new CANNON.Body({ mass: 0 });
doorBody.addShape(doorShape);
doorBody.position.copy(door.position);
world.addBody(doorBody);

// 문 열고 닫는 함수
function openDoor() {
door.visible = false;
world.removeBody(doorBody);
isDoorOpen = true;
}

function closeDoor() {
door.visible = true;
world.addBody(doorBody);
isDoorOpen = false;
}

return { leftWall, rightWall, backWall, ceiling, floor, door, doorBody, wallBodies, openDoor, closeDoor };
}

function toggleDoor() {
let targetRotation = isDoorOpen ? 0 : Math.PI / 2; // 목표 회전각 설정
let duration = 500; // 애니메이션 시간 (밀리초)
let startTime = performance.now();

function animateDoor() {
let currentTime = performance.now();
let elapsed = currentTime - startTime;
let progress = Math.min(elapsed / duration, 1); // 진행률 (0 ~ 1)

door.rotation.y = targetRotation * progress; // 문 회전

if (progress < 1) {
    requestAnimationFrame(animateDoor);
} else {
    if (isDoorOpen) {
        booth.closeDoor();
        isDoorOpen=!isDoorOpen;
        console.log("문을 닫습니다.");
    } else {
        booth.openDoor();
        isDoorOpen=!isDoorOpen;
        console.log("문을 엽니다.");
    }
    isDoorOpen = !isDoorOpen; // 문 상태 반전
}
}

animateDoor();
}

// 캐릭터와 문 사이의 거리 계산 함수
function isCharacterNearDoor(characterPosition, doorPosition, distance) {
const dx = characterPosition.x - doorPosition.x;
const dy = characterPosition.y - doorPosition.y;
const dz = characterPosition.z - doorPosition.z;
const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
return dist <= distance;
}

// 예시로 부스를 생성
const booth = createBoothWithDoor(10, 5, 10, 0, 2.5, 0, '../static/images/1.jpeg', 2, 5, 0.1);
booth.openDoor();

const booth2 = createBoothWithDoor(10, 5, 10, -50, 2.5, 0, '../static/images/2.jpeg', 1.5, 4, 0.1);
booth2.openDoor();

const booth3 = createBoothWithDoor(10, 5, 10, 0, 2.5, -50, '../static/images/3.jpeg', 2, 5, 0.1);
booth3.openDoor();

const booth4 = createBoothWithDoor(10, 5, 10, -50, 2.5, -50, '../static/images//4.jpeg', 2, 5, 0.1);
booth4.openDoor();

const booth5 = createBoothWithDoor(10, 5, 10, 50, 2.5, 0, '../static/images//5.jpeg', 2, 5, 0.1);
booth5.openDoor();

const booth6 = createBoothWithDoor(10, 5, 10, 50, 2.5, -50, '../static/images//6.jpeg', 2, 5, 0.1);
booth5.openDoor();

const booth7 = createBoothWithDoor(10, 5, 10, 0, 2.5, 50, '../static/images//7.jpeg', 2, 5, 0.1);
booth7.openDoor();

const booth8 = createBoothWithDoor(10, 5, 10, -50, 2.5, 50, '../static/images//8.jpeg', 2, 5, 0.1);
booth8.openDoor();

const booth9 = createBoothWithDoor(10, 5, 10, 50, 2.5, 50, '../static/images/9.jpeg', 2, 5, 0.1);
booth9.openDoor();



window.addEventListener('keydown', (e) => {
if (e.code === 'Space') {
let user = users[username];
if (user) {
    let distance = user.body.position.distanceTo(door.position);
    console.log(distance);
    console.log(isDoorOpen);
    if (distance < openCloseDistance) { // 문과의 거리 확인
        toggleDoor();
    }
}
}
});


// 텍스처 로드: TextureLoader를 사용하여 이미지 로드
const textureLoader = new THREE.TextureLoader();
const photoTexture = textureLoader.load('../static/images/짱구.jpeg'); // 여기서 이미지 경로를 실제 이미지 경로로 바꿉니다.
const photoTexture2 = textureLoader.load('../static/images/흰둥이.jpeg');

// 부스 안에 사진을 전시하는 함수 생성
function createPhotoWall(width, height, x, y, z, texture) {
const wallGeometry = new THREE.PlaneGeometry(width, height);
const wallMaterial = new THREE.MeshBasicMaterial({ map: texture });

const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.set(x, y, z); // 필요에 따라 위치 조정
scene.add(wall);

// 만약 물리적 바디가 필요하다면 추가합니다.
// 예시:
// const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, 0.1));
// const wallBody = new CANNON.Body({ mass: 0 });
// wallBody.addShape(wallShape);
// wallBody.position.set(x, y, z);
// world.addBody(wallBody);

return wall;
}



const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const boothNumberInput = document.getElementById('booth-number');


const boothPositions = {
    1: { x: -50, y: 2, z: -50 },
    2: { x: 0, y: 2, z: -50 },
    3: { x: 50, y: 2, z: -50 },
    4: { x: -50, y: 2, z: 0 },
    5: { x: 0, y: 2, z: 0 },
    6: { x: 50, y: 2, z: 0 },
    7: { x: -50, y: 2, z: 50 },
    8: { x: 0, y: 2, z: 50 },
    9: { x: 50, y: 2, z: 50 }
};

function displayPhoto(data) {
    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load(data.filePath);
    createPhotoWall(4, 2, data.boothPosition.x, data.boothPosition.y, data.boothPosition.z, photoTexture);
}

socket.on('display_existing_photos', (photos) => {
    photos.forEach(photo => {
        const boothPosition = boothPositions[photo.boothNumber];
        console.log(photo.filePath);
        displayPhoto({ filePath: photo.filePath, boothPosition });
    });
});


uploadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    const boothNumber = boothNumberInput.value;
    if (file && boothNumber) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('boothNumber', boothNumber);
     

        fetch('http://localhost:8081/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const filePath = data.filePath;
            const boothNumber = data.boothNumber;
            const boothPosition = boothPositions[boothNumber];
      
           if (file.type.startsWith('video')) {
                createVideoWall(4, 2, boothPosition.x, boothPosition.y, boothPosition.z, data.filePath);
            }else{
            socket.emit('photo_uploaded', { filePath: filePath, boothPosition: boothPosition });
            }
        })
        .catch(error => console.error('Error uploading file:', error));
    }
});

socket.on('display_photo', (data) => {
    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load(data.filePath);
    console.log("데이터 받았다");
    const photoWall=createPhotoWall(4, 2, data.boothPosition.x, data.boothPosition.y, data.boothPosition.z, photoTexture);
    scene.add(photoWall);
});




// Video 텍스처를 생성하는 함수
function createVideoWall(width, height, x, y, z, videoPath) {
    const video = document.createElement('video');
    video.src = videoPath;
    video.autoplay = true;
    video.loop = true;
    video.load();
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const wallGeometry = new THREE.PlaneGeometry(width, height);
    const wallMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    scene.add(wall);

    return wall;
}
