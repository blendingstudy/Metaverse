const socket = io('http://127.0.0.1:8081');

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
    socket.emit('register', { username: username });
});

function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60);

    for (let username in users) {
        let user = users[username];
        user.model.position.copy(user.body.position);
        user.model.quaternion.copy(user.body.quaternion);
    }

    renderer.render(scene, camera);
}

animate();
