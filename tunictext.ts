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

    public drawActivePass(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, color: string, active: boolean) {
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
    protected vowel: VowelGlyphSegment;
    protected consonant: ConsonantGlyphSegment;

    public constructor(vowel?: VowelGlyphSegment, consonant?: ConsonantGlyphSegment) {
        this.vowel = vowel ?? new VowelGlyphSegment();
        this.consonant = consonant ?? new ConsonantGlyphSegment();
    }

    public draw(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, activeColor: string, inactiveColor: string, lineWidth = 2) {
        context.lineWidth = lineWidth;
        context.lineCap = "round";
        this.vowel.draw(context, position, size, activeColor, inactiveColor);
        this.consonant.draw(context, position, size, activeColor, inactiveColor);
    }

    public drawMultiPass(context: CanvasRenderingContext2D, position: Vector2, size: Vector2, activeColor: string, inactiveColor: string, lineWidth = 2) {
        context.lineWidth = lineWidth;
        context.lineCap = "round";
        this.vowel.drawActivePass(context, position, size, inactiveColor, false);
        this.consonant.drawActivePass(context, position, size, inactiveColor, false);
        this.vowel.drawActivePass(context, position, size, activeColor, true);
        this.consonant.drawActivePass(context, position, size, activeColor, true);
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

const BLACK: string = '#000';
const GRAY: string = '#AAA';
const TRANSPARENT: string = '#ffffff00';

class TunicText {
    private textCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private textContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    private glyphCanvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private glyphContext: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

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
        this.text.draw(this.textContext, new Vector2(10, 10), this.fontSize, 3, BLACK, GRAY);
    }

    public addGlyph(glyph: TunicGlyph) {
        this.text.add(glyph.clone());

        this.draw();
    }

    private initialize() {
        this.initializeCanvas('text-canvas', (canvas, context) => { this.textCanvas = canvas; this.textContext = context });
        this.initializeCanvas('glyph-canvas', (canvas, context) => { this.glyphCanvas = canvas; this.glyphContext = context });

        this.editor.initialize(this.glyphCanvas, this.glyphContext);
    }

    private initializeCanvas(id: string, out: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void) {
        let canvas = <HTMLCanvasElement>document.getElementById(id);
        let context = canvas.getContext('2d');
        if (context == null) {
            console.error('Could not create context');
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        out(canvas, context);
    }
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
}

class EditorHandler {

}

class GlyphEditor {
    private tunicText: TunicText;
    private glyph: EditorTunicGlyph = new EditorTunicGlyph();
    private editorControls: HTMLElement = {} as HTMLElement;
    private canvas: HTMLCanvasElement = {} as HTMLCanvasElement;
    private context: CanvasRenderingContext2D = {} as CanvasRenderingContext2D;

    public constructor(tunicText: TunicText) {
        this.tunicText = tunicText;
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
        this.draw();
    }

    private addContainer(heading: string, count: number, indexOffset: number) {
        const container = document.createElement('fieldset');
        container.className = 'editor_box';
        const headingElement = document.createElement('legend');
        headingElement.innerText = heading;
        container.appendChild(headingElement);

        for (let index = 0; index < count; index++) {
            const name = heading + '_' + index;
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = (index + indexOffset).toString();
            checkbox.name = name;
            checkbox.onclick = () => { this.checkboxClicked(checkbox); };
            container.appendChild(checkbox);
            const label = document.createElement('label');
            label.setAttribute('for', name);
            label.innerText = index.toString();
            container.appendChild(label);
        }
        this.editorControls.appendChild(container);
    }

    private checkboxClicked(checkbox: HTMLInputElement) {
        const index = parseInt(checkbox.value);
        this.glyph.setSegment(index, checkbox.checked);
        this.draw();
    }

    private draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.glyph.drawMultiPass(this.context, new Vector2(10, 10), new Vector2(this.canvas.width - 20, this.canvas.height - 20), BLACK, GRAY, 10);
    }
}

window.onload = function () {
    const params = new URLSearchParams(window.location.search);
    new TunicText(params).run();
};
