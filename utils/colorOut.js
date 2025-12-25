function basePrint(color, msg) {
  console.log(`%c${msg}`, `color: ${color}`)
}

function printRed(msg) {
  basePrint("red", msg)
}

function printGreen(msg) {
  basePrint("green", msg)
}

function printYellow(msg) {
  basePrint("yellow", msg)
}

function printBlue(msg) {
  basePrint("blue", msg)
}

function printMagenta(msg) {
  basePrint("magenta", msg)
}

function printGrey(msg) {
  basePrint("grey", msg)
}

export {
  printGreen, printBlue, printRed, printYellow, printMagenta, printGrey
}
