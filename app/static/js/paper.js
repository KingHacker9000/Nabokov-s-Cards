class Paper {
    constructor(s, x, y, type="word", madeFrom=[]) {
        this.s = s;
        this.x = x;
        this.y = y;
        this.type = type;
        this.madeFrom = madeFrom

        this.w = note_w * typeMultipliers[type];
        this.h = note_h * typeMultipliers[type];

        if (s.length > 400) {
            this.w += (this.s.length - 200)/4
            this.h += (this.s.length - 200)/4
        }
        this.pickedUp = false;
        this.mousedX;
        this.mousedY;

        const randomIndex = Math.floor(Math.random() * stickyNoteColors.length);
        this.color = stickyNoteColors[randomIndex].rgb;
        const randomIndexImg = Math.floor(Math.random() * noteImages.length);
        this.image = noteImages[randomIndexImg]

        this.sizeFac = 1;

        const scaleF = this.w * this.sizeFac / this.image.width;
        this.imgWidth = this.image.width * scaleF;
        this.imgHeight = this.image.height * scaleF;
    }

    drawNote() {

        // Check if in Tray Area
        if (openTray && this.x + this.w >= width - TrayWidth) {
            this.sizeFac = map(min((this.x + this.w - width + TrayWidth), this.w), 0, this.w, 1, 0.5)

            if (this.sizeFac == 0.5 && !trayNotes.includes(this)) {
                trayNotes.push(this)
            }
        }
        else if (openTray) {
            this.sizeFac = 1;

            if (trayNotes.includes(this)) {
                moveToEnd(trayNotes, trayNotes.indexOf(this)).pop()
            }
        }
        else {
            this.sizeFac = 1;
        }

        // See Stack
        if (selected && selectedNote == this && this.madeFrom.length > 0) {
            // drawMadeFromNote(this.madeFrom[0], this.x+(60*this.sizeFac), this.y-(60*this.sizeFac), this.w*this.sizeFac, this.h*this.sizeFac, this.color)
            // drawMadeFromNote(this.madeFrom[1], this.x+(30*this.sizeFac), this.y-(30*this.sizeFac), this.w*this.sizeFac, this.h*this.sizeFac, this.color)
        }


        //drawStickyNote(this.x, this.y, this.w, this.h, this.color, this.sizeFac);
        const scaleF = this.w * this.sizeFac / this.image.width;
        this.imgWidth = this.image.width * scaleF;
        this.imgHeight = this.image.height * scaleF;
        image(this.image, this.x, this.y, this.imgWidth, this.imgHeight)

        if(this.pickedUp){
            this.drawOverlay(this.x, this.y, this.w*this.sizeFac, this.h*this.sizeFac)
        }

        fill(0, 0, 0)
        textAlign(CENTER, CENTER);
        let calculatedFontSize = map(max(min(3137464, height * width), 300000), 300000, 3137464, 14, 16)
        textSize(calculatedFontSize * this.sizeFac);
        textFont('Lora');
        noStroke()

        if (selectedNote != this) {
            drawWrappedPaperText(this.s, Math.trunc(this.x + (this.w/2)*this.sizeFac), Math.trunc(this.y), (this.w - 70)*this.sizeFac, this.imgHeight, this.sizeFac)
        }
    }

    stackSize() {
        let i = 0;

        if (this.madeFrom.length == 0) {
            return 1
        }

        return this.madeFrom[0].stackSize() + this.madeFrom[1].stackSize()
    }

    setCoordinate(){
        // this.x = Math.trunc(mouseX - note_w/2)
        // this.y = mouseY-20
        this.x = (!touch ? mouseX : touches[0].x) - this.mousedX
        this.y = (!touch ? mouseY : touches[0].y) - this.mousedY
    }

    setMouseCoordinate(){
        this.mousedX = (!touch ? mouseX : touches[0].x) - this.x;
        this.mousedY = (!touch ? mouseY : touches[0].y) - this.y;
    }

    drawOverlay(){

        fill(0, 0, 0, 50); // Semi-transparent black for the overlay
        stroke(0, 0, 0, 100);
        notes.forEach(note => {
            if (note != this && this.isOverlapped(note)){
                note.drawNote()
                fill(0, 0, 0, 50); // Semi-transparent black for the overlay
                stroke(0, 0, 0, 100);
                rect(note.x, note.y, note.imgWidth*note.sizeFac, note.imgHeight*note.sizeFac, 3*this.sizeFac);
                
                this.pickedUp = false;
                this.drawNote()
                this.pickedUp = true;

                fill(0, 0, 0, 50); // Semi-transparent black for the overlay
                stroke(0, 0, 0, 100);
                rect(this.x, this.y, this.imgWidth*this.sizeFac, this.imgHeight*this.sizeFac, 3*this.sizeFac);

                fill(255, 255, 255, 50); // Semi-transparent black for the overlay
                stroke(255, 255, 255, 100);
                circle(this.x + this.imgWidth*this.sizeFac/2, this.y+(this.imgHeight*this.sizeFac/2), 50*this.sizeFac)
                textSize(24);
                textFont('Lora');
                text("+", this.x + this.imgWidth*this.sizeFac/2, this.y + this.imgHeight*this.sizeFac/2)
            }
        });
        noStroke()
    }

    async regenerate(){
        let n1 = this.madeFrom[0]
        let n2 = this.madeFrom[1]
        
        try {
            const url = window.location.href + "/combine"
    
            const data = {
                s1: n1.s,
                type1: n1.type,
                s2: n2.s,
                type2: n2.type
            };
    
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const reply = await response.json();
            
            this.s = reply.s;

            if (selectedNote == this) {
                input.value(this.s)
            }
    
        } catch (error) {
            console.log(error)
        }

    }

    isMouseOver() {
        return mouseX >= this.x && mouseX <= this.x + this.imgWidth * this.sizeFac &&
        mouseY >= this.y && mouseY <= this.y + this.imgHeight * this.sizeFac
    }

    resize() {

        if (this.s.length > 25 && this.type == "word"){
            this.type = "sentence"
        }
        if (this.s.length > 100) {
            this.type = "paragraph"
        }


        this.w = note_w * typeMultipliers[this.type];
        this.h = note_h * typeMultipliers[this.type];


        if (this.s.length > 400) {
            this.w += (this.s.length - 200)/4
            this.h += (this.s.length - 200)/4
        }
        input.size((this.imgWidth - 50)*this.sizeFac, (this.imgHeight - 50)*this.sizeFac);
    }

    isOverlapped(note){
        let thisCX = (this.x + this.imgWidth/ 2) 
        let thisCY = (this.y + this.imgHeight/ 2)

        let otherCX = (note.x + note.imgWidth/ 2) 
        let otherCY = (note.y + note.imgHeight/ 2)
        
        if (DEBUG) {
            circle(thisCX, thisCY, 10) 
            circle(otherCX, otherCY, 10)
        }
        return ((thisCX - otherCX)**2 + (thisCY - otherCY)**2) <= 8000
    }
}

function drawWrappedPaperText(s, x, y, maxWidth, height, sizeFac) {
    let words = s.replace(/\n/g, ' ').split(' '); // Split the text into words
    let line = ''; // Initialize an empty line
    let lineHeight = 20 * sizeFac; // Set line height (you can change this based on your font size)

    curr_y = 0
    let lines = []

    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + ' '; // Build the test line
        let testWidth = textWidth(testLine); // Get the width of the test line

        // If the test width exceeds the maximum width, draw the line and start a new one
        if (testWidth > maxWidth && i > 0) {
            //text(line, x, y); // Draw the line
            lines.push({s: line, y: curr_y})
            line = words[i] + ' '; // Start a new line with the current word
            curr_y += lineHeight; // Move down to the next line
        } else {
            line = testLine; // Otherwise, continue adding words to the line
        }
    }
    //text(line, x, y); // Draw any remaining text in the last line
    lines.push({s: line, y: curr_y})

    let half_y = curr_y / 2

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        text(line.s, x, y + height/2 - half_y + line.y)
    }

}

function drawMadeFromNote(note, x, y, w, h, color) {
  
    // Draw the shadow for the sticky note
    fill(0, 0, 0, 50); // Semi-transparent black for the shadow
    noStroke()
    rect(x + 10, y + 10, w, h, 10); // Shadow slightly offset

    // Set the color for the sticky note (light yellow)
    fill(color[0]-20, color[1]-20, color[2]-20, 255); // Yellow with some transparency
    stroke(color[0]+10, color[1]+10, color[2]+10); // Light gray stroke for outline
    strokeWeight(2);
    
    // Draw the rectangle (sticky note)
    rect(x, y, w, h, 2); // Rounded corners

    strokeWeight(1);
    fill(0, 0, 0, 30);
    triangle(x+w, y+h-35, x+w-35, y+h, x+w-35, y+h-35);

    fill(0, 0, 0)
    textAlign(LEFT, CENTER);
    textSize(map(min(1500000, height * width), 300000, 1500000, 16, 24));
    textFont('Lora');

    s = note.s
    let maxLen = 15

    while (textWidth(s.substring(0, maxLen)) < w - 55 && maxLen < s.length) {
        maxLen += 1
    }

    if (s.length > maxLen) {
        s = s.substring(0, maxLen) + "..."; // Truncate and add ellipsis
    }
    text(s, x + 15, y + 15)
}