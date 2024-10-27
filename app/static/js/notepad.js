// Calculate position and size for the notepad
let notepadWidth = 0;
let notepadHeight = 0;
let notepadX = 0;
let t = "";
let notePad = null;

// Function to create a notepad on the right side of the canvas
function drawNotepad() {
  
    notepadWidth = width * 0.3;  // 40% of the canvas width
    notepadHeight = height * 0.8;      // Full canvas height
    notepadX = width - notepadWidth; // Position it on the right side
    // Create a textarea HTML element for the notepad

    if (notePad) {
        notePad.remove(); // Remove the old textarea if it exists
    }

    notePad = createElement('textarea');
    notePad.size(notepadWidth-50, notepadHeight - 50);
    notePad.position(notepadX+45, height * 0.05 + 50);
    notePad.style('resize', 'none');           // Prevent resizing
    notePad.style('padding', '10px');          // Add padding for readability
    notePad.style('font-size', '16px');        // Set a comfortable font size
    notePad.style('background-color', '#fdfd9600'); // Light yellow background
    notePad.style('border', 'none'); // Border style
    notePad.style('outline', 'none');
    notePad.style('color', '#333'); // Border style
    notePad.style('font-family', 'Georgia, serif');
    notePad.value(t);
}

function drawNotepadBackground() {
    // Draw background for the notepad area on the right side
  fill(245, 241, 233); // Light paper-like color
  noStroke();
  rect(notepadX, height * 0.05, notepadWidth, notepadHeight);

  // Draw lines to simulate a lined notepad
  stroke(200, 200, 255); // Light blue color for lines
  for (let y = height * 0.05 + 31 + 50; y < notepadHeight; y += 24) {
    line(notepadX + 10, y, width - 10, y);
  }

  // Draw a red margin line on the left side of the notepad area
  stroke(255, 100, 100); // Light red color for margin
  line(notepadX + 40, height * 0.05, notepadX + 40, height*0.85);

  // Draw the title text "NotePad" at the top of the notepad
  textAlign(CENTER, CENTER);
  textSize(36);
  fill(80, 80, 160, 60); // Darker color for the title text
  stroke(80, 80, 160, 30)
  text("NotePad", notepadX + notepadWidth / 2, height * 0.05 + 30); // Centered at the top

  t = notePad.value()
}