const TrayButtonH = 100;
const TrayButtonW = 40
let TrayWidth;

let trayNotes = [];


function drawTrayButton() {
    const h = TrayButtonH/2;
    const w = TrayButtonW;

    fill(232,75,34)
    stroke(232,75,34)
    imageMode(CENTER)

    if (!openTray) {
        if (overTrayButton()) {
            fill(212,55,14) 
        }
        // Tray is Closed
        rect(width-w, (height/2) - h, w+20, 2*h, 20)
        textSize(24);
        textFont('Lora');
        stroke(0, 0, 0)
        fill(0,0,0)
        // text(s, width - (w/2), height/2)
        image(suitcaseImage, width - (w/2), height/2, 30, 30)
    }

    else {
        if (overTrayButton()) {
            fill(212,55,14) 
        }
        
        // Tray is Open
        rect(width-w-TrayWidth, (height/2) - h, w+20, 2*h, 20)
        textSize(24);
        textFont('Lora');
        stroke(0, 0, 0)
        fill(0,0,0)
        // text(s, width - (w/2)-TrayWidth, height/2)
        image(suitcaseImage, width - (w/2)-TrayWidth, height/2, 30, 30)
    }
    imageMode(CORNER)

}

function overTrayButton() {
    const h = TrayButtonH/2

    if (!openTray) {
        return mouseX > width - TrayButtonW && (height/2) - h <= mouseY && mouseY <= (height/2) + h
    }

    return mouseX > width - TrayButtonW - TrayWidth && mouseX <= width - TrayWidth && (height/2) - h <= mouseY && mouseY <= (height/2) + h
}

function touchOverTrayButton(touchX, touchY) {
    const h = TrayButtonH/2

    if (!openTray) {
        return touchX > width - TrayButtonW && (height/2) - h <= touchY && touchY <= (height/2) + h
    }

    return touchX > width - TrayButtonW - TrayWidth && touchX <= width - TrayWidth && (height/2) - h <= touchY && touchY <= (height/2) + h
}

function clickTrayButton() {

    for (let i = 0; i < trayNotes.length; i++) {
        const note = trayNotes[i];

        
        // Going to Close Tray
        if (openTray) {
            note.x += TrayWidth;
        }
        else {
            note.x -= TrayWidth;
        }
    }
    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];

        if (trayNotes.includes(note)) {
            continue
        }

        // Going to Close Tray
        if (openTray) {
            note.x *= 6/5;
        }
        else {
            note.x *= 5/6;
        }
    }
    
    openTray = !openTray;
}


// Tray

function drawTray() {
    fill(232,75,34)
    stroke(232,75,34)
    rect(width-TrayWidth, 0, TrayWidth, height)
    
    textSize(24);
    textFont('Lora');
    noStroke()
    fill(0,0,0)
    text("Stash", width - (TrayWidth/2), 20)
}