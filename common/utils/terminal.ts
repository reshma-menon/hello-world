import { isNode } from "./env";
import { Color, HexColor } from "./color";
/**
 * Created by n.vinayakan on 06.06.17.
 */
const performance = global["performance"] || Date;
export class Terminal {

    static silent: boolean = false;
    static history: string = "";
    static browserStyles = {
        text: HexColor[Color.DEFAULT_TEXT],
        background: HexColor[Color.DEFAULT_BG],
        bold: false
    };
    static browserBuffer: { text: string, style: string }[] = [];
    static timeLogs: { name: string, startTime: number, finishTime?: number, finished: boolean }[] = [];
    static _level: number = process.env.TERMINAL_LOG_LEVEL ? parseInt(process.env.TERMINAL_LOG_LEVEL) : 3;
    static set level(value: string | number) {
        switch (value) {
            case -1:
            case "none": Terminal._level = -1; break;
            case 0:
            case "error": Terminal._level = 0; break;
            case 1:
            case "warn": Terminal._level = 1; break;
            case 2:
            case "info": Terminal._level = 2; break;
            case 3:
            case "log": Terminal._level = 3; break;
        }
    }
    static get level(): string | number {
        switch (Terminal._level) {
            case -1: return "none";
            case 0: return "error";
            case 1: return "warn";
            case 2: return "info";
            case 3: return "log";
        }
        return 0;
    }

    static log(text) {
        if (Terminal._level > 2) {
            Terminal.write(text + "\n");
        }
    }

    static write(text) {
        if (typeof text !== "string") {
            text = text === undefined ? "undefined" : JSON.stringify(text);
        }
        Terminal.history += text;
        if (Terminal.silent) {
            return;
        }
        if (isNode) {
            process.stdout.write(text);
        } else {
            if (text === "\n") {
                let texts: string[] = [];
                let styles: string[] = [];
                Terminal.browserBuffer.forEach(log => {
                    texts.push(log.text);
                    styles.push(log.style);
                });
                console.log.apply(null, [texts.join("")].concat(styles));
                Terminal.browserBuffer = [];
            } else {
                Terminal.browserBuffer.push({
                    text: `%c${text}`,
                    style: `background: ${Terminal.browserStyles.background};` +
                        `color: ${Terminal.browserStyles.text};` +
                        `font-weight: ${Terminal.browserStyles.bold ? "700" : "100"};`
                })
            }
        }
    }

    static time(name: string) {
        if (!Terminal.silent) {
            Terminal.timeLogs.push({ name: name, startTime: performance.now(), finished: false });
        }
    }

    static timeEnd(name: string) {
        if (!Terminal.silent) {
            const finishTime: number = performance.now();
            let log = Terminal.timeLogs.find(log => (log.name === name && log.finished === false));
            if (log !== undefined) {
                const duration = finishTime - log.startTime;
                log.finished = true;
                log.finishTime = finishTime;
                Terminal.text(` ⌛️ ${name} ${duration.toFixed(3)}ms`, Color.AQUA);
            } else {
                Terminal.warn(`log name ${name} is not found`);
            }
        }
    }

    static setBGColor(color) {
        if (isNode) {
            if (process.stdout.isTTY) {
                process.stdout.write(`\x1B[48;5;${color === null ? "" : color}m`);
            }
        } else {
            Terminal.browserStyles.background = HexColor[color];
        }
    }

    static setTextColor(color) {
        if (isNode) {
            if (process.stdout.isTTY) {
                process.stdout.write(`\x1B[38;5;${color}m`);
            }
        } else {
            Terminal.browserStyles.text = HexColor[color];
        }
    }

    static setBoldText() {
        if (isNode) {
            if (process.stdout.isTTY) {
                process.stdout.write(`\x1B[38;1m`);
            }
        } else {
            Terminal.browserStyles.bold = true;
        }
    }

    static clearColor() {
        if (isNode) {
            if (process.stdout.isTTY) {
                process.stdout.write(`\x1B[0m`);
            }
        } else {
            Terminal.browserStyles.text = HexColor[Color.DEFAULT_TEXT];
            Terminal.browserStyles.background = "none";
            Terminal.browserStyles.bold = false;
        }
    }

    static error(text: Error | string) {
        if (Terminal._level > -1) {
            Terminal.setBGColor(Color.RED);
            Terminal.setTextColor(Color.WHITE);
            Terminal.write(" ERROR ");
            Terminal.clearColor();
            Terminal.setTextColor(Color.RED);
            Terminal.write(" ");
            Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }

    static warn(text: string) {
        if (Terminal._level > 0) {
            Terminal.setBGColor(Color.ORANGE);
            Terminal.setTextColor(Color.WHITE);
            Terminal.write(" WARNING ");
            Terminal.clearColor();
            Terminal.setTextColor(Color.ORANGE);
            Terminal.write(" ");
            Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }

    static success(text: string) {
        if (Terminal._level > 2) {
            Terminal.setBGColor(Color.GREEN);
            Terminal.setTextColor(Color.WHITE);
            Terminal.write(" SUCCESS ");
            Terminal.clearColor();
            Terminal.setTextColor(Color.GREEN);
            Terminal.write(" ");
            Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }

    static info(text: string) {
        if (Terminal._level > 1) {
            Terminal.setBGColor(Color.BLUE);
            Terminal.setTextColor(Color.WHITE);
            Terminal.write(" INFO ");
            Terminal.clearColor();
            Terminal.setTextColor(Color.BLUE);
            Terminal.write(" ");
            Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }

    static print(title: string, text: any, color = Color.WHITE, bgColor = Color.ORANGE) {
        if (Terminal._level > 2) {
            Terminal.setBGColor(bgColor);
            Terminal.setTextColor(color);
            if (title !== undefined) Terminal.write(` ${title} `);
            Terminal.clearColor();
            Terminal.setTextColor(bgColor);
            Terminal.write(" ");
            if (text !== undefined) Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }

    static text(text: any, color = Color.WHITE) {
        if (Terminal._level > 2) {
            Terminal.setTextColor(color);
            Terminal.write(text);
            Terminal.write("\n");
            Terminal.clearColor();
        }
    }
}
