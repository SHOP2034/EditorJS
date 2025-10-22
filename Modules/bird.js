// modules/bird.js
// Aquí definimos draw routines y la estructura por defecto de duckParts.
// Exporta: drawDuck(ctx, center, duckParts, frameCount), DEFAULT_DUCK_PARTS

export const DEFAULT_DUCK_PARTS = {
  body: { name: 'Cuerpo', x: 0, y: 0, scale: 1, rotation: 0, radius: 16, color: '#c9c9c9', zIndex: 1 },
  chest: { name: 'Pecho', x: 4.8, y: 0, scale: 1, rotation: 0, radius: 16, color: 'hsl(25,100%,30%)', zIndex: 2 },
  wing: { name: 'Ala', x: -0.8, y: -4.8, scale: 1, rotation: 0, baseRotation: 0, zIndex: 3 },
  feathers: { name: 'Plumas', x: -17, y: -10, scale: 1, rotation: (-31 * Math.PI) / 180, zIndex: 4 },
  tail: { name: 'Cola', x: -12, y: -3.2, scale: 1, rotation: 0, zIndex: 0 },
  head: { name: 'Cabeza', x: 14.4, y: -4.8, scale: 1, rotation: 0, radius: 11.2, zIndex: 5 },
  bill: { name: 'Pico', x: 14.4, y: -4.8, scale: 1, rotation: 0, zIndex: 6 },
  leftLeg: { name: 'Pata Izq', x: -4.8, y: 8, scale: 1, rotation: 0, zIndex: -1 },
  rightLeg: { name: 'Pata Der', x: 1.6, y: 8, scale: 1, rotation: 0, zIndex: -1 }
};

function drawBody(ctx, part){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const r = part.radius || 16;
  ctx.fillStyle = part.color || '#c9c9c9';
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}

function drawChest(ctx, part){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const r = part.radius || 16;
  ctx.fillStyle = part.color || '#c9c9c9';
  ctx.beginPath(); ctx.arc(0,0,r,-Math.PI/2.2,Math.PI/2.2); ctx.fill();
  ctx.restore();
}

function drawWing(ctx, part){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation + (part.baseRotation || 0));
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.quadraticCurveTo(-r*0.7,-r*0.85,-r*1.4,0);
  ctx.quadraticCurveTo(-r*0.7,r*0.85,0,0);
  ctx.closePath();
  ctx.fillStyle = '#c9c9c9'; ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#1976d2'; ctx.beginPath(); ctx.arc(-r*1.2,0,r*0.6,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.restore();
}

function drawFeathers(ctx, part, frameCount){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const fr = 15;
  const baseAngle = (-18 * Math.PI) / 180;
  ctx.strokeStyle = 'rgba(60,60,60,0.7)'; ctx.lineWidth = 1.3;
  for (let i=0;i<3;i++){
    ctx.save();
    ctx.rotate(baseAngle + Math.sin(frameCount * 0.05 + i) * 0.05);
    const offsetY = fr * (0.6 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(-fr*0.6, offsetY*0.1);
    ctx.quadraticCurveTo(-fr*1.1, offsetY*0.6, -fr*0.2, offsetY*0.9);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawTail(ctx, part){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const r = 16;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0,0); ctx.lineTo(-r*1.0,-r*0.5); ctx.lineTo(-r*1.0,r*0.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-r*0.9,-r*0.4); ctx.lineTo(-r*0.9,r*0.3); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawHead(ctx, part, frameCount){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const headR = part.radius || 11.2;
  ctx.fillStyle = '#1b5e20';
  ctx.beginPath(); ctx.arc(0,0,headR,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0,0,headR,Math.PI*0.7,Math.PI*1.3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,headR,0,Math.PI*2); ctx.stroke();
  const blinkInterval = 180, blinkDuration = 5;
  if (frameCount % blinkInterval < blinkDuration) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(headR*0.25,-headR*0.15); ctx.lineTo(headR*0.55,-headR*0.12); ctx.stroke();
  } else {
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(headR*0.35,-headR*0.12,headR*0.18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(headR*0.45,-headR*0.20,headR*0.06,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawBill(ctx, part){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const headR = 11.2;
  ctx.fillStyle = '#f9c74f';
  ctx.beginPath(); ctx.moveTo(headR*0.9,-headR*0.16); ctx.lineTo(headR*1.45,0); ctx.lineTo(headR*0.9,headR*0.16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

function drawLeg(ctx, part, baseRotation){
  ctx.save();
  ctx.translate(part.x, part.y);
  ctx.scale(part.scale, part.scale);
  ctx.rotate(part.rotation);
  const r = 16; const legLength = r * 1.1;
  ctx.strokeStyle = '#ff9b42'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.save();
  ctx.rotate(0.4 + baseRotation);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-legLength*0.6,legLength*0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-legLength*0.6,legLength*0.4); ctx.lineTo(-legLength*0.8,legLength*0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-legLength*0.55,legLength*0.4); ctx.lineTo(-legLength*0.55,legLength*0.25); ctx.stroke();
  ctx.restore(); ctx.restore();
}

export function drawDuck(ctx, center, duckParts, frameCount){
  // espera ctx ya limpiado externamente
  // center: {x,y} donde se translate antes de dibujar partes
  ctx.save();
  // fondo simple (nubes) lo puede dejar o quitar el main
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(100,80,30,0,Math.PI*2); ctx.arc(130,80,40,0,Math.PI*2); ctx.arc(160,80,30,0,Math.PI*2); ctx.fill();

  ctx.translate(center.x, center.y);

  const sortedParts = Object.entries(duckParts).sort((a,b)=>a[1].zIndex - b[1].zIndex);
  for (const [key, part] of sortedParts){
    if (key === 'body') drawBody(ctx, part);
    else if (key === 'chest') drawChest(ctx, part);
    else if (key === 'wing') drawWing(ctx, part);
    else if (key === 'feathers') drawFeathers(ctx, part, frameCount);
    else if (key === 'tail') drawTail(ctx, part);
    else if (key === 'head') drawHead(ctx, part, frameCount);
    else if (key === 'bill') drawBill(ctx, part);
    else if (key === 'leftLeg') {
      const legAngle = Math.sin(frameCount*0.2)*0.2; drawLeg(ctx, part, legAngle);
    } else if (key === 'rightLeg') {
      const legAngle = Math.sin(frameCount*0.2)*0.2; drawLeg(ctx, part, -legAngle);
    }
  }

  ctx.restore();
}

