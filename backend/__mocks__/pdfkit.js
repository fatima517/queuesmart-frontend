// Jest manual mock for pdfkit — prevents tslib/fontkit resolution errors in test environment
class PDFDocument {
  constructor() {
    this.page = { margins: { left: 40 }, height: 792 }
    this._stream = null
  }
  pipe(stream) { this._stream = stream; return this }
  fontSize()   { return this }
  font()       { return this }
  fillColor()  { return this }
  text()       { return this }
  moveDown()   { return this }
  moveTo()     { return this }
  lineTo()     { return this }
  stroke()     { return this }
  addPage()    { return this }
  end()        { if (this._stream) { this._stream.write(Buffer.alloc(600)); this._stream.end() } }
}

module.exports = PDFDocument
