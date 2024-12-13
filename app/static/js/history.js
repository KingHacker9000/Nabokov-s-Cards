let history = []
let historyIndex = 0

class HistoryAction {

    constructor(){
        console.log(history, "a", historyIndex)
        console.log("slice:", history.slice(0, historyIndex+1))
        if (historyIndex+1 < history.length) {
            history = history.slice(0, historyIndex+1)
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
        this.n1.carnation.hide()
        this.n2.carnation.hide()
        moveToEnd(notes, notes.indexOf(this.n1)).pop()
        moveToEnd(notes, notes.indexOf(this.n2)).pop()
        notes.push(this.new_note)
    }

    redo () {
        this.new_note.carnation.hide()
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
        this.new_note.carnation.hide()
        moveToEnd(notes, notes.indexOf(this.new_note)).pop()
        notes.push(this.n1)
        notes.push(this.n2)
    }

    redo () {
        this.n1.carnation.hide()
        this.n2.carnation.hide()
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
        this.note.carnation.hide()
        moveToEnd(notes, notes.indexOf(this.note)).pop()
    }
}

class HistoryRegenerate extends HistoryAction {
    constructor(note, old_text) {
        super()
        this.note = note
        this.old_text = old_text
        this.text = note.s
    }

    undo () {
        this.note = this.old_text
    }

    redo () {
        this.note = this.text
    }
}

class HistoryAdd extends HistoryAction {
    constructor(note) {
        super()
        this.note = note
    }

    undo () {
        this.note.carnation.hide()
        moveToEnd(notes, notes.indexOf(this.note)).pop()
        this.note.carnation.hide()
    }

    redo () {
        notes.push(this.note)
        this.note.carnation.show()
    }
}