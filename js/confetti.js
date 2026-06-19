import { DOM } from './state.js';

export function launchConfetti() {
    const canvas = DOM.confettiCanvas;
    canvas.classList.remove('hidden');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = Array.from({ length: 160 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 3,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        tilt: 0,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.1 + 0.04,
        speed: Math.random() * 3 + 1,
    }));
    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.tiltAngle += p.tiltSpeed;
            p.y += p.speed;
            p.tilt = Math.sin(p.tiltAngle) * 12;
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
            }
        });
        frame++;
        if (frame < 200) requestAnimationFrame(draw);
        else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.classList.add('hidden');
        }
    }
    requestAnimationFrame(draw);
}
