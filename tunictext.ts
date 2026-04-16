class Vector2 {
    x: number;
    y: number;

    constructor(x?: number, y?: number) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }
}

class Line {
    start: Vector2 = new Vector2();
    end: Vector2 = new Vector2();

    constructor(start?: Vector2, end?: Vector2) {
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

abstract class GlyphSegment {
    protected mapping: boolean[];
    protected phonetic: string;
    private structure: Line[];

    public constructor(structure: Line[]) {
        this.phonetic = "";
        this.structure = structure;
        this.mapping = Array<boolean>(structure.length);
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

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, activeColor: string, inactiveColor: string) {
        for (let index = 0; index < this.structure.length; index++) {
            const line = this.structure[index];
            const isActive = this.mapping[index];
            context.strokeStyle = isActive ? activeColor : inactiveColor;
            context.beginPath();
            context.moveTo(position.x + size.x * line.start.x, position.y + size.y * line.start.y);
            context.lineTo(position.x + size.x * line.end.x, position.y + size.y * line.end.y);
            context.stroke();
        }
    }
}

class VowelGlyphSegment extends GlyphSegment {
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
}

class ConsonantGlyphSegment extends GlyphSegment {
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
}

class TunicGlyph {
    private vowel: VowelGlyphSegment;
    private consonant: ConsonantGlyphSegment;

    public constructor(vowel?: VowelGlyphSegment, consonant?: ConsonantGlyphSegment) {
        this.vowel = vowel ?? new VowelGlyphSegment();
        this.consonant = consonant ?? new ConsonantGlyphSegment();
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, activeColor: string, inactiveColor: string) {
        context.lineWidth = 2;
        this.vowel.draw(context, position, size, activeColor, inactiveColor);
        this.consonant.draw(context, position, size, activeColor, inactiveColor);
    }

    public getPhonetic(): string {
        return this.consonant.getPhonetic() + this.vowel.getPhonetic();
    }

    public clone(): TunicGlyph {
        return new TunicGlyph(this.vowel.clone(), this.consonant.clone());
    }
}

class TunicString {
    glyphs: TunicGlyph[] = [];

    public reset() {
        this.glyphs = [];
    }

    public add(glyph: TunicGlyph) {
        this.glyphs.push(glyph);
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, kerning: number, activeColor: string, inactiveColor: string) {
        for (let index = 0; index < this.glyphs.length; index++) {
            const glyph = this.glyphs[index];
            const glyphPosition = new Vector2(position.x + (size.x + kerning) * index, position.y);
            glyph.draw(context, glyphPosition, size, activeColor, inactiveColor);
        }
    }
}

const BLACK: string = "#000";
const GRAY: string = "#AAA";
const TRANSPARENT: string = "#ffffff00";

class TunicText {
    private textCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private textContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private glyphCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private glyphContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private params: URLSearchParams;
    private fontSize = new Vector2(20, 30);

    private glyph: TunicGlyph = new TunicGlyph();
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
        this.text.draw(this.textContext, new Vector2(10, 10), this.fontSize, 3, BLACK, GRAY);
    }

    public drawEditor() {
        this.glyphContext.clearRect(0, 0, this.glyphCanvas.width, this.glyphCanvas.height);
        this.glyph.draw(this.glyphContext, new Vector2(10, 10), new Vector2(this.glyphCanvas.width - 20, this.glyphCanvas.height - 20), BLACK, GRAY);
    }

    public addGlyph() {
        this.text.add(this.glyph.clone());

        this.draw();
    }

    private initialize() {
        this.initializeCanvas('text-canvas', (canvas, context) => { this.textCanvas = canvas; this.textContext = context });
        this.initializeCanvas('glyph-canvas', (canvas, context) => { this.glyphCanvas = canvas; this.glyphContext = context });

        this.editor.initialize();
    }

    private initializeCanvas(id: string, out: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void) {
        let canvas = <HTMLCanvasElement>document.getElementById(id);
        let context = canvas.getContext('2d');
        if (context == null) {
            console.error("Could not create context");
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        out(canvas, context);
    }
}

class GlyphEditor {
    private tunicText: TunicText;

    public constructor(tunicText: TunicText) {
        this.tunicText = tunicText;
    }

    public initialize() {
        this.tunicText.drawEditor();
    }
}

window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    new TunicText(params).run();
};