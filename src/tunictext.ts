class Vector2 {
    public x: number;
    public y: number;

    public constructor(x?: number, y?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }

    public add(other: Vector2) {
        this.x += other.x;
        this.y += other.y;        
    }

    public subtract(other: Vector2) {
        this.x -= other.x;
        this.y -= other.y;
    }

    public length(): number {
        return this.x * this.y;
    }

    public normalize() {
        const length = this.length();
        this.x /= length;
        this.y /= length;
    }

    public static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    public static subtract(a: Vector2, b: Vector2): Vector2 {
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    public static normalize(a: Vector2): Vector2 {
        const length = a.length();
        return new Vector2(a.x / length, a.y / length);
    }
}

class Line {
    public start: Vector2 = new Vector2();
    public end: Vector2 = new Vector2();

    public constructor(start?: Vector2, end?: Vector2) {
        this.start = start ?? new Vector2();
        this.end = end ?? new Vector2();
    }
}

const TOP_ANCHOR = new Vector2(0.5, 0);
const BOTTOM_ANCHOR = new Vector2(0.5, 1);
const TOP_LEFT_ANCHOR = new Vector2(0, 0.2);
const BOTTOM_LEFT_ANCHOR = new Vector2(0, 0.8);
const TOP_RIGHT_ANCHOR = new Vector2(1, 0.2);
const BOTTOM_RIGHT_ANCHOR = new Vector2(1, 0.8);
const INNER_TOP_ANCHOR = new Vector2(0.5, 0.35);
const INNER_BOTTOM_ANCHOR = new Vector2(0.5, 0.65);
const SWAP_MARKER_RADIUS = 0.1;

abstract class GlyphSegment {
    protected mapping: boolean[];
    protected phonetic: string;
    private structure: Line[];

    public constructor(structure: Line[]) {
        this.phonetic = '';
        this.structure = structure;
        this.mapping = Array.from(structure, () => false);
    }

    public getCount(): number {
        return this.mapping.length;
    }

    public getPhonetic(): string {
        return this.phonetic;
    }

    public setLetter(phonetic: string, mapping: boolean[]) {
        this.phonetic = phonetic;
        for (let index = 0; index < this.structure.length; index++) {
            if (mapping.length > index)
                this.mapping[index] = mapping[index];
        }
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, color: string, active: boolean) {
        for (let index = 0; index < this.structure.length; index++) {
            const line = this.structure[index];
            if (this.mapping[index] == active) {
                context.strokeStyle = color;
                context.beginPath();
                context.moveTo(position.x + size.x * line.start.x, position.y + size.y * line.start.y);
                context.lineTo(position.x + size.x * line.end.x, position.y + size.y * line.end.y);
                context.stroke();
            }
        }
    }

    public getValue(index: number): boolean {
        if (index >= 0 && index < this.mapping.length)
            return this.mapping[index];
        return false;
    }

    public setValue(index: number, value: boolean) {
        if (index >= 0 && index < this.mapping.length)
            this.mapping[index] = value;
    }

    public detectPhonetic(): boolean {
        this.phonetic = '';
        const ownPattern = this.export();
        const patterns = this.getPatterns();
        const value = patterns.get(ownPattern);
        if (value != undefined) {
            this.phonetic = value;
            return true;
        }
        return false;
    }

    public export(): string {
        let output = '';
        this.mapping.forEach(element => {
            output += element ? '1' : '0';
        });
        return output;
    }

    public abstract getPatterns(): Map<string, string>;
}

class VowelGlyphSegment extends GlyphSegment {

    private static patterns: Map<string, string> = new Map([
        ['110001', 'æ'],
        ['100001', 'ɔ'],
        ['000110', 'ɪ'],
        ['000111', 'e'],
        ['000011', 'ə'],
        ['110000', 'ʌ'],
        ['100111', 'i'],
        ['110011', 'uː'],
        ['010111', 'ər'],
        ['110101', 'ɔə'],
        ['110110', 'ʌə'],
        ['100101', 'ɪə'],
        ['100000', 'eɪ'],
        ['010000', 'aɪ'],
        ['000010', 'ɔɪ'],
        ['000100', 'aʊ'],
        ['110111', 'oʊ'],
        ['000101', 'eə'],
    ]);

    constructor() {
        super([
            new Line(TOP_LEFT_ANCHOR, TOP_ANCHOR),
            new Line(TOP_ANCHOR, TOP_RIGHT_ANCHOR),
            new Line(TOP_RIGHT_ANCHOR, BOTTOM_RIGHT_ANCHOR),
            new Line(BOTTOM_RIGHT_ANCHOR, BOTTOM_ANCHOR),
            new Line(BOTTOM_ANCHOR, BOTTOM_LEFT_ANCHOR),
            new Line(BOTTOM_LEFT_ANCHOR, TOP_LEFT_ANCHOR)
        ]);
    }

    clone(): VowelGlyphSegment {
        const segment = new VowelGlyphSegment();
        segment.phonetic = this.phonetic;
        segment.mapping = Object.assign([], this.mapping);
        return segment;
    }

    public getPatterns(): Map<string, string> {
        return VowelGlyphSegment.patterns;
    }

    public static getPatterns(): Map<string, string> {
        return VowelGlyphSegment.patterns;
    }
}

class ConsonantGlyphSegment extends GlyphSegment {
    private static patterns: Map<string, string> = new Map([
        ['0000101', 'm'],
        ['0100101', 'n'],
        ['1111111', 'ŋ'],
        ['1001010', 'p'],
        ['1010001', 'b'],
        ['1101010', 't'],
        ['1010101', 'd'],
        ['1011001', 'k'],
        ['1001011', 'g'],
        ['1010100', 'dʒ'],
        ['1100010', 'tʃ'],
        ['1001110', 'f'],
        ['1110001', 'v'],
        ['1111010', 'θ'],
        ['1010111', 'ð'],
        ['1011110', 's'],
        ['1110011', 'z'],
        ['1101111', 'ʃ'],
        ['1111101', 'ʒ'],
        ['1010011', 'h'],
        ['1011010', 'r'],
        ['1110010', 'j'],
        ['0101000', 'w'],
        ['1010010', 'l'],
    ]);

    constructor() {
        super([
            new Line(INNER_TOP_ANCHOR, INNER_BOTTOM_ANCHOR),
            new Line(TOP_LEFT_ANCHOR, INNER_TOP_ANCHOR),
            new Line(TOP_ANCHOR, INNER_TOP_ANCHOR),
            new Line(INNER_TOP_ANCHOR, TOP_RIGHT_ANCHOR),
            new Line(BOTTOM_LEFT_ANCHOR, INNER_BOTTOM_ANCHOR),
            new Line(BOTTOM_ANCHOR, INNER_BOTTOM_ANCHOR),
            new Line(INNER_BOTTOM_ANCHOR, BOTTOM_RIGHT_ANCHOR),
        ]);
    }

    clone(): ConsonantGlyphSegment {
        const segment = new ConsonantGlyphSegment();
        segment.phonetic = this.phonetic;
        segment.mapping = Object.assign([], this.mapping);
        return segment;
    }

    public getPatterns(): Map<string, string> {
        return ConsonantGlyphSegment.patterns;
    }

    public static getPatterns(): Map<string, string> {
        return ConsonantGlyphSegment.patterns;
    }
}

class TunicGlyph {
    protected vowel: VowelGlyphSegment;
    protected consonant: ConsonantGlyphSegment;
    protected swap: boolean;

    public constructor(vowel?: VowelGlyphSegment, consonant?: ConsonantGlyphSegment, swap?: boolean) {
        this.vowel = vowel ?? new VowelGlyphSegment();
        this.consonant = consonant ?? new ConsonantGlyphSegment();
        this.swap = swap ?? false;
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, color: string, lineWidth = 2) {
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        this.vowel.draw(context, position, size, color, true);
        this.consonant.draw(context, position, size, color, true);
        if (this.swap) {
            this.drawSwap(context, size, position);
        }
    }

    private drawSwap(context: CanvasRenderingContext2D, size: Vector2, position: Vector2) {
        context.beginPath();
        const radius = new Vector2(SWAP_MARKER_RADIUS * size.x, SWAP_MARKER_RADIUS * size.y);
        context.ellipse(position.x + BOTTOM_ANCHOR.x * size.x, position.y + BOTTOM_ANCHOR.y * size.y + radius.y, radius.x, radius.x, 0, 0, Math.PI * 2);
        context.stroke();
    }

    public drawMultiPass(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, activeColor: string, inactiveColor: string, lineWidth = 2) {
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        this.vowel.draw(context, position, size, inactiveColor, false);
        this.consonant.draw(context, position, size, inactiveColor, false);
        if (!this.swap) {
            context.strokeStyle = inactiveColor;
            this.drawSwap(context, size, position);
        }
        this.vowel.draw(context, position, size, activeColor, true);
        this.consonant.draw(context, position, size, activeColor, true);
        if (this.swap) {
            context.strokeStyle = activeColor;
            this.drawSwap(context, size, position);
        }
    }

    public getPhonetic(): string {
        const phonetic = this.swap ?
            this.vowel.getPhonetic() + this.consonant.getPhonetic() :
            this.consonant.getPhonetic() + this.vowel.getPhonetic();
        if (phonetic.length == 0)
            return '  ';
        return phonetic;
    }

    public clone(): TunicGlyph {
        return new TunicGlyph(this.vowel.clone(), this.consonant.clone(), this.swap);
    }

    public export(): string {
        return `${this.vowel.export()}|${this.vowel.getPhonetic()}|${this.consonant.export()}|${this.consonant.getPhonetic()}|${this.swap ? '1' : '0'}`;
    }
}

const MAX_TEXT_WIDTH = 720;

class TunicString {
    private glyphs: TunicGlyph[] = [];

    public add(glyph: TunicGlyph) {
        this.glyphs.push(glyph);
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, kerning: number, color: string) {
        let line = 0;
        let lineIndex = 0;
        for (let index = 0; index < this.glyphs.length; index++) {
            const glyph = this.glyphs[index];
            const glyphPosition = new Vector2(position.x + (size.x + kerning) * (index - lineIndex), position.y + line * (size.y + 15));
            glyph.draw(context, glyphPosition, size, color);
            if (glyphPosition.x + size.x > MAX_TEXT_WIDTH) {
                line++;
                lineIndex = index + 1;
            }
        }
    }

    public drawPhonetics(context: CanvasRenderingContext2D, position: Vector2, color: string) {
        const text = this.getPhonetics();
        context.fillStyle = color;
        context.font = '20px sans-serif';
        const textMetrics = context.measureText(text);
        if (textMetrics.width < MAX_TEXT_WIDTH) {
            context.fillText(text, position.x, position.y + 20);
        }
        else {
            const charWidth = textMetrics.width / text.length;
            const maxLineLength = MAX_TEXT_WIDTH / charWidth;
            let renderedText = text;
            let line = 1;
            while (renderedText.length > 0) {
                context.fillText(renderedText.substring(0, maxLineLength), position.x, position.y + 20 * line);
                renderedText = renderedText.substring(maxLineLength);
                line++;
            }
        }
    }

    public clear() {
        this.glyphs = [];
    }

    private getGlyphIndex(input: Vector2, position: Vector2, size: Vector2, kerning: number): number {
        const x = input.x;
        const y = input.y;

        let line = 0;
        let lineIndex = 0;
        for (let index = 0; index < this.glyphs.length; index++) {
            const glyphPosition = new Vector2(position.x + (size.x + kerning) * (index - lineIndex), position.y + line * (size.y + 15));
            if (glyphPosition.x + size.x > MAX_TEXT_WIDTH) {
                line++;
                lineIndex = index + 1;
            }
            if (x >= glyphPosition.x && x < (glyphPosition.x + size.x) && y >= glyphPosition.y && y < (glyphPosition.y + size.y))
                return index;
        }

        return -1;
    }

    public getGlyph(location: Vector2, position: Vector2, size: Vector2, kerning: number): TunicGlyph | undefined {
        const index = this.getGlyphIndex(location, position, size, kerning);
        if (index != -1) {
            return this.glyphs[index];
        }
    }

    public removeGlyph(location: Vector2, position: Vector2, size: Vector2, kerning: number) {
        const index = this.getGlyphIndex(location, position, size, kerning);
        if (index != -1) {
            this.glyphs.splice(index, 1);
        }
    }
    public load(value: string) {
        this.clear();
        const glyphDefinitions = value.split('#');
        glyphDefinitions.forEach(element => {
            const glyphElements = element.split('|');
            if (glyphElements.length != 5) {
                console.error('Could not import: Pattern invalid.');
                return;
            }
            const glyph = new EditorTunicGlyph();
            glyph.loadSegment(TunicGlyphSegment.Vowel, glyphElements[0]);
            glyph.loadSegment(TunicGlyphSegment.Consonant, glyphElements[2]);
            glyph.setSwap(glyphElements[4] === '1');
            this.add(glyph.clone());
        });
    }

    public export(): string {
        return Array.from(this.glyphs, glyph => glyph.export()).join('#');
    }

    public getPhonetics(): string {
        return Array.from(this.glyphs, glyph => glyph.getPhonetic()).join('');
    }
}

const BLACK: string = '#000';
const GRAY: string = '#AAA';
const TRANSPARENT: string = '#ffffff00';

class TunicText {
    private textCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private textContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private glyphCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private glyphContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private output: HTMLInputElement = {} as HTMLInputElement;
    private outputPhonetics: HTMLInputElement = {} as HTMLInputElement;

    private params: URLSearchParams;
    private fontSize = new Vector2(20, 30);

    private text: TunicString = new TunicString();

    private editor: GlyphEditor;

    public constructor(params: URLSearchParams) {
        this.params = params;
        this.editor = new GlyphEditor(this);
    }

    public run() {
        this.initialize();
    }

    public draw() {
        this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        this.text.draw(this.textContext, new Vector2(10, 10), this.fontSize, 3, BLACK);

        this.text.drawPhonetics(this.textContext, new Vector2(10, 200 + this.fontSize.y), BLACK);
        this.output.value = this.text.export();
        this.outputPhonetics.value = this.text.getPhonetics().replace(/ +(?= )/g, '');
    }

    public addGlyph(glyph: TunicGlyph) {
        this.text.add(glyph.clone());
        this.draw();
    }

    private initialize() {
        this.initializeCanvas('text-canvas', (canvas, context) => { this.textCanvas = canvas; this.textContext = context });
        this.initializeCanvas('glyph-canvas', (canvas, context) => { this.glyphCanvas = canvas; this.glyphContext = context });
        this.output = <HTMLInputElement>document.getElementById('string');
        const loadButton = <HTMLButtonElement>document.getElementById('load');
        loadButton.onclick = () => this.loadString(this.output.value);
        const clearButton = <HTMLButtonElement>document.getElementById('clear');
        clearButton.onclick = () => this.clear();
        this.outputPhonetics = <HTMLInputElement>document.getElementById('phonetics');

        this.editor.initialize(this.glyphCanvas, this.glyphContext);
        this.textCanvas.addEventListener('mousedown', event => this.canvasMouseDown(event), false);
    }

    private loadString(value: string) {
        this.text.load(value);
        this.draw();
    }

    private canvasMouseDown(event: MouseEvent) {
        event.preventDefault();
        const rawX = event.pageX - this.textCanvas.offsetLeft + this.textCanvas.clientLeft;
        const rawY = event.pageY - this.textCanvas.offsetTop + this.textCanvas.clientTop;
        const location = new Vector2(rawX, rawY);
        this.editor.canvasMouseDown(location, event.button);
    }

    private initializeCanvas(id: string, out: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void) {
        const canvas = <HTMLCanvasElement>document.getElementById(id);
        canvas.oncontextmenu = () => false;
        const context = canvas.getContext('2d');
        if (context == null) {
            console.error('Could not create context');
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        out(canvas, context);
    }

    public clear() {
        this.text.clear();
        this.draw();
    }

    public deleteClickedGlyph(location: Vector2) {
        this.text.removeGlyph(location, new Vector2(10, 10), this.fontSize, 3);
        this.draw();
    }
    public getClickedGlyph(location: Vector2): TunicGlyph | undefined {
        return this.text.getGlyph(location, new Vector2(10, 10), this.fontSize, 3);
    }
}

enum TunicGlyphSegment {
    Vowel,
    Consonant
}

class EditorTunicGlyph extends TunicGlyph {
    public getTotalCount(out?: (vowelCount: number, consonant: number) => void): number {
        if (out != null)
            out(this.vowel.getCount(), this.consonant.getCount());
        return this.vowel.getCount() + this.consonant.getCount();
    }

    public getSegment(index: number): boolean {
        if (index < this.vowel.getCount())
            return this.vowel.getValue(index);
        else
            return this.consonant.getValue(index - this.vowel.getCount());
    }

    public setSegment(index: number, value: boolean) {
        if (index < this.vowel.getCount())
            this.vowel.setValue(index, value);
        else
            this.consonant.setValue(index - this.vowel.getCount(), value);
    }

    public getSwap(): boolean { return this.swap; }
    public setSwap(value: boolean) { this.swap = value; }

    public import(input: string) {
        const splitInput = input.split('|');
        if (splitInput.length != 5) {
            console.error('Could not import: Pattern invalid.');
            return;
        }
        this.importSegment(TunicGlyphSegment.Vowel, splitInput[0], splitInput[1]);
        this.importSegment(TunicGlyphSegment.Consonant, splitInput[2], splitInput[3]);
        this.swap = splitInput[4] == '1';
    }

    public loadSegment(target: TunicGlyphSegment, pattern: string) {
        const segment = target === TunicGlyphSegment.Vowel ? this.vowel : this.consonant;
        const data = Array.from(pattern, c => c === '1');
        for (let index = 0; index < data.length; index++) {
            segment.setValue(index, data[index]);
        }
        segment.detectPhonetic();
    }


    public importSegment(target: TunicGlyphSegment, input: string, key: string) {
        const segment = target === TunicGlyphSegment.Vowel ? this.vowel : this.consonant;
        const pattern = Array.from(input, c => c === '1');
        segment.setLetter(key, pattern);
    }

    public detectPhonetics() {
        this.vowel.detectPhonetic();
        this.consonant.detectPhonetic();
    }
}

class EditorKey {
    private pattern: string;
    private key: string;

    private canvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private button: HTMLButtonElement = {} as HTMLButtonElement;
    private container: HTMLElement;
    private keyboard: EditorKeyboard;
    private segment: TunicGlyphSegment;
    private glyph: EditorTunicGlyph;

    public static create(keyboard: EditorKeyboard, segment: TunicGlyphSegment, pattern: string, key: string, container: HTMLElement): EditorKey {
        const editorKey = new EditorKey(keyboard, segment, pattern, key, container);
        editorKey.createInstance();
        return editorKey;
    }

    private constructor(keyboard: EditorKeyboard, segment: TunicGlyphSegment, pattern: string, key: string, container: HTMLElement) {
        this.keyboard = keyboard;
        this.pattern = pattern;
        this.key = key;
        this.container = container;
        this.segment = segment;
        this.glyph = new EditorTunicGlyph();
        this.glyph.importSegment(segment, pattern, key);
    }

    private createInstance() {
        this.canvas = document.createElement('canvas');
        this.canvas.height = 54;
        this.canvas.width = 32;
        this.canvas.style = "border-radius: 5px";
        this.button = document.createElement('button');
        this.button.onclick = () => { this.keyboard.keyPressed(this); };
        this.button.appendChild(this.canvas);
        this.container.appendChild(this.button);

        const context = this.canvas.getContext('2d');
        if (context == null) {
            console.error('Could not create canvas for button');
            return;
        }
        this.glyph.draw(context, new Vector2(4, 2), new Vector2(24, 36), BLACK);
        context.textAlign = "center";
        context.font = "10px sans-serif";
        context.fillText(this.key, 15, 50);
    }

    public getSegment(): TunicGlyphSegment { return this.segment; }
    public getPattern(): string { return this.pattern; }
}

class EditorKeyboard {
    private editor: GlyphEditor;
    private keys: EditorKey[] = [];

    public constructor(editor: GlyphEditor) {
        this.editor = editor;
    }

    public initialize(keyboardContainer: HTMLElement) {
        keyboardContainer.style = "display: flex; flex-flow: row wrap; justify-content: center;";
        this.createButtons(TunicGlyphSegment.Vowel, VowelGlyphSegment.getPatterns(), keyboardContainer);
        this.createButtons(TunicGlyphSegment.Consonant, ConsonantGlyphSegment.getPatterns(), keyboardContainer);
    }

    private createButtons(segment: TunicGlyphSegment, data: Map<string, string>, container: HTMLElement) {
        data.forEach((value: string, key: string) => {
            this.keys.push(EditorKey.create(this, segment, key, value, container));
        });
        const lineWrap = document.createElement('div');
        lineWrap.style = "flex-basis: 100%; height: 0;";
        container.appendChild(lineWrap);
    }

    public keyPressed(key: EditorKey) {
        this.editor.set(key.getSegment(), key.getPattern());
    }
}

class GlyphEditor {
    private tunicText: TunicText;
    private glyph: EditorTunicGlyph = new EditorTunicGlyph();
    private editorControls: HTMLElement = {} as HTMLElement;
    private canvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private context: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private checkboxes: HTMLInputElement[] = [];
    private exportText: HTMLInputElement = {} as HTMLInputElement;

    private keyboard: EditorKeyboard;
    private swapCheckbox: HTMLInputElement = {} as HTMLInputElement;

    public constructor(tunicText: TunicText) {
        this.tunicText = tunicText;
        this.keyboard = new EditorKeyboard(this);
    }

    public initialize(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.context = context;

        let editorControls = document.getElementById('editor_controls');
        if (editorControls == null) {
            console.error('Could not find "editor_controls"');
            return;
        }
        this.editorControls = editorControls;

        let vowelSegmentCount = 0;
        let consonantSegmentCount = 0;
        this.glyph.getTotalCount((vowelCount, consonantCount) => { vowelSegmentCount = vowelCount; consonantSegmentCount = consonantCount; });
        this.addContainer('Vowel', vowelSegmentCount, 0);
        this.addContainer('Constants', consonantSegmentCount, vowelSegmentCount);

        {
            const container = this.createContainer('Tools');
            container.appendChild(this.createButton('Reset', () => { this.reset(0, vowelSegmentCount + consonantSegmentCount, true); }));
            container.appendChild(this.createButton('Add Glyph', () => {
                this.tunicText.addGlyph(this.glyph.clone());
            }));
            container.appendChild(this.createButton('Add Space', () => {
                this.tunicText.addGlyph(new TunicGlyph());
            }));
            this.exportText = document.createElement('input');
            this.exportText.type = 'text';
            container.appendChild(this.exportText);
            container.appendChild(this.createButton('Import', () => {
                this.glyph.import(this.exportText.value);
                this.draw();
            }));
            this.swapCheckbox = document.createElement('input');
            this.swapCheckbox.type = 'checkbox';
            this.swapCheckbox.name = 'swap';
            this.swapCheckbox.onclick = () => { this.toggleSwap(); };
            container.appendChild(this.swapCheckbox);
            const label = document.createElement('label');
            label.setAttribute('for', 'swap');
            label.innerText = 'Swap vowel and consonant'
            container.appendChild(label);
            this.editorControls.appendChild(container);
        }
        {
            const keyboardContainer = this.createContainer('Keyboard');
            this.editorControls.appendChild(keyboardContainer);
            this.keyboard.initialize(keyboardContainer);
        }

        this.refreshExport();
        this.draw();
    }

    private toggleSwap() {
        this.glyph.setSwap(!this.glyph.getSwap());
        this.updateCheckboxes();
        this.refreshExport();
        this.draw();
    }

    private addContainer(heading: string, count: number, indexOffset: number) {
        const container = this.createContainer(heading);

        for (let index = 0; index < count; index++) {
            const name = heading + '_' + index;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = (index + indexOffset).toString();
            checkbox.name = name;
            checkbox.onclick = () => { this.checkboxClicked(checkbox); };
            container.appendChild(checkbox);
            this.checkboxes.push(checkbox);
            const label = document.createElement('label');
            label.setAttribute('for', name);
            label.innerText = index.toString();
            container.appendChild(label);
        }
        const resetButton = this.createButton('Reset', () => { this.reset(indexOffset, indexOffset + count, false); });
        container.appendChild(resetButton);
        this.editorControls.appendChild(container);
    }

    private createButton(text: string, onclick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.innerText = text;
        button.onclick = onclick;
        return button;
    }

    private createContainer(heading: string) {
        const container = document.createElement('fieldset');
        container.className = 'editor_box';
        const headingElement = document.createElement('legend');
        headingElement.innerText = heading;
        container.appendChild(headingElement);
        return container;
    }

    private checkboxClicked(checkbox: HTMLInputElement) {
        const index = parseInt(checkbox.value);
        this.glyph.setSegment(index, checkbox.checked);
        this.glyph.detectPhonetics();
        this.refreshExport();
        this.draw();
    }

    private reset(start: number, end: number, resetSwap: boolean) {
        for (let index = start; index < end; index++) {
            this.glyph.setSegment(index, false);
        }
        if (resetSwap)
            this.glyph.setSwap(false);
        this.glyph.detectPhonetics();
        this.updateCheckboxes();
        this.refreshExport();
        this.draw();
    }

    private refreshExport() {
        this.exportText.value = this.glyph.export();
    }

    private draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.glyph.drawMultiPass(this.context, new Vector2(10, 10), new Vector2(this.canvas.width - 20, this.canvas.height - 30), BLACK, GRAY, 10);
    }

    public canvasMouseDown(location: Vector2, button: number) {
        if (button == 0) {
            const glyph = this.tunicText.getClickedGlyph(location);
            if (glyph != undefined) {
                this.glyph.import(glyph.export());
                this.updateCheckboxes();
                this.refreshExport();
                this.draw();
            }
        } else if (button == 2) {
            this.tunicText.deleteClickedGlyph(location);
        }
    }

    public set(segment: TunicGlyphSegment, pattern: string) {
        this.glyph.loadSegment(segment, pattern);
        this.updateCheckboxes();
        this.refreshExport();
        this.draw();
    }

    private updateCheckboxes() {
        for (let index = 0; index < this.checkboxes.length; index++) {
            this.checkboxes[index].checked = this.glyph.getSegment(index);
        }
        this.swapCheckbox.checked = this.glyph.getSwap();
    }
}

window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    new TunicText(params).run();
};
