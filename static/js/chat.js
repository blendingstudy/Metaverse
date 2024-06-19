const socket = io('http://127.0.0.1:8081');

document.getElementById('message-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const inputMessage = document.getElementById('input-message').value;
    if (inputMessage) {
        socket.emit('chat_message', { username: username, message: inputMessage });
        document.getElementById('input-message').value = '';
    }
});

socket.on('chat_message', function (data) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.innerHTML = `<strong>${data.username}:</strong> <span class="message-content">${data.message}</span>`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});
