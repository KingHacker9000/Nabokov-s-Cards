const history = []
let historyIndex = -1

class HistoryAction {

    constructor(){
        for (let i = historyIndex+1; i < history.length; i++) {
            moveToEnd(history, historyIndex+1).pop()
        }
        console.log(history)
    }

    undo() {
        console.log("Undo Event")
    }
    
    redo() {
        console.log("Redo Event")
    }
}

class HistoryDecouple extends HistoryAction {
    constructor(n1, n2, new_note) {
        super()
        this.n1 = n1;
        this.n2 = n2;
        this.new_note = new_note
    }

    undo () {
        moveToEnd(notes, notes.indexOf(this.n1)).pop()
        moveToEnd(notes, notes.indexOf(this.n2)).pop()
        notes.push(this.new_note)
    }

    redo () {
        moveToEnd(notes, notes.indexOf(this.new_note)).pop()
        notes.push(this.n1)
        notes.push(this.n2)
    }
}

class HistoryCouple extends HistoryAction {
    constructor(n1, n2, new_note) {
        super()
        this.n1 = n1;
        this.n2 = n2;
        this.new_note = new_note
    }

    undo () {
        moveToEnd(notes, notes.indexOf(this.new_note)).pop()
        notes.push(this.n1)
        notes.push(this.n2)
    }

    redo () {
        moveToEnd(notes, notes.indexOf(this.n1)).pop()
        moveToEnd(notes, notes.indexOf(this.n2)).pop()
        notes.push(this.new_note)
    }
}

class HistoryDelete extends HistoryAction {
    constructor(note) {
        super()
        this.note = note
    }

    undo () {
        notes.push(this.note)
    }

    redo () {
        moveToEnd(notes, notes.indexOf(this.note)).pop()
    }
}