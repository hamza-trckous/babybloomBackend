const Event = require("events");
const Events = new Event();

class Logger extends Event {
  log() {
    this.emit("message", { id: 2222 });
  }
}

module.exports = Logger;
