class LoadingAnimation {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.dotCount = 3; // Number of dots
      this.currentDot = 0; // Tracks the current dot being displayed
      this.timer = 0; // Timer for controlling animation speed
      this.interval = 100; // Time in milliseconds between dot updates
      this.isComplete = false; // Animation completion status
    }
  
    update() {
      // Increment the timer and update the current dot based on the interval
      this.timer += deltaTime;
      if (this.timer > this.interval) {
        this.timer = 0; // Reset timer
        this.currentDot = (this.currentDot + 1) % (this.dotCount + 1); // Cycle through 0 to 3
      }
    }
  
    display() {
      fill(240, 240, 240, 240); // White dots
      for (let i = 0; i < this.currentDot; i++) {
        let xPos = this.x + i * 15; // Spacing between dots
        ellipse(xPos, this.y, 10, 10); // Draw the dot
      }
    }
  
    complete() {
      this.isComplete = true; // Mark animation as complete
    }
  }