import { db } from "@/db";
import { Logger } from "./Logger";
import { questions, type QuestionType, type SelectQuestion } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export class Question {
    readonly id: string | null;
    private _position: number;
    private _content: string;
    private _answers: string[];
    private _points: number;
    private _type: QuestionType;
    readonly initialized: boolean;
    static readonly logger = new Logger("Question");

    constructor(position: number, content: string, answers: string[], points: number, type: QuestionType) {
        this.id = null;
        this._position = position;
        this._content = content;
        this._answers = answers.map(a => a.toLowerCase());
        this._points = points;
        this._type = type;
        this.initialized = false;
    }

    get() {
        return {
            id: this.id,
            position: this._position,
            content: this._content,
            answers: this._answers,
            points: this._points,
            type: this._type,
        };
    }

    toJSON() {
        return this.get();
    }

    async create() {
        if (this.initialized) {
            throw new Error("Question already instantiated");
        }
        const result = await db.insert(questions).values({
            position: this._position,
            content: this._content,
            answer: this._answers.join(";"),
            type: this._type,
            points: this._points
        }).returning();

        (this.id as string | null) = result[0].id;
        (this.initialized as boolean) = true;
        console.log("Question created with id", this.id);
        await Question.logger.info(`New question created with id ${this.id} and position ${this._position}`);
        const newQ = await Question.normalizePositions(this.id!);
        if (!newQ) {
            throw new Error("Question error - not found");
        }
        this._position = newQ.position;
    }

    /**
     * 
     * @param id The id of the question for which to return the normalized position (after normalization)
     */
    static async normalizePositions(id?: string): Promise<SelectQuestion | null> {
        const qs = await db.select().from(questions).orderBy(asc(questions.position));
        let r: SelectQuestion | null = null;
        for (let i = 0; i < qs.length; i++) {
            const q = qs[i];
            await db.update(questions).set({ position: i + 1 }).where(eq(questions.id, q.id));
            q.position = i + 1;
            if (id && q.id === id) {
                r = q;
            }
        }
        await Question.logger.info("Questions normalized", 3);
        return r;
    }

    static async fromId(id: string) {
        const q = (await db.select().from(questions).where(eq(questions.id, id)))[0];
        // instantiate a new Question object from the object returned by the query
        const question = new Question(q.position, q.content, q.answer.split(";"), q.points, q.type);
        (question.id as string | null) = q.id;
        (question.initialized as boolean) = true;
        return question;
    }

    static async fromQuestionObject(q: SelectQuestion) {
        const question = new Question(q.position, q.content, q.answer.split(";"), q.points, q.type);
        (question.id as string | null) = q.id;
        (question.initialized as boolean) = true;
        return question;
    }

    static async fromPosition(position: number) {
        const q = (await db.select().from(questions).where(eq(questions.position, position)))[0];
        if (!q) {
            throw new Error("Question not found");
        }
        const question = new Question(q.position, q.content, q.answer.split(";"), q.points, q.type);
        (question.id as string | null) = q.id;
        (question.initialized as boolean) = true;
        return question;
    }

    static async add(content: string, answers: string[], points: number, type: QuestionType) {
        const q = new Question(Number.MAX_SAFE_INTEGER, content, answers, points, type);
        await q.create();
        return q;
    }

    static async all() {
        return db.select().from(questions).orderBy(questions.position);
    }


    // position getter/setter and funcs

    get position() {
        return this._position;
    }

    set position(value: number) {
        this._position = value;
        if (this.initialized) {
            this.updatePosition(value);
        }
    }

    async updatePosition(value: number) {
        if (!this.id || !this.initialized) {
            throw new Error("Question not instantiated");
        }
        await db.update(questions).set({ position: value }).where(eq(questions.id, this.id));
        const q = await Question.normalizePositions(this.id);
        if (!q) {
            throw new Error("Question error - not found");
        }

        await Question.logger.info(`Question ${this.id} moved to position ${q.position} from ${this._position}`);
        this._position = q.position;
    }

    // content getter/setter and funcs
    get content() {
        return this._content;
    }

    set content(value: string) {
        this._content = value;
        if (this.initialized) {
            this.updateContent(value);
        }
    }

    async updateContent(value: string) {
        if (!this.id || !this.initialized) {
            throw new Error("Question not instantiated");
        }
        await db.update(questions).set({ content: value }).where(eq(questions.id, this.id));
        await Question.logger.info(`Question ${this.id} content updated`);
    }

    // answer getter/setter and funcs
    get answers() {
        return this._answers;
    }

    set answers(value: string[]) {
        this._answers = value;
        if (this.initialized) {
            this.updateAnswer(value);
        }
    }

    async updateAnswer(value: string[]) {
        if (!this.id || !this.initialized) {
            throw new Error("Question not instantiated");
        }
        await db.update(questions).set({ answer: value.join(";") }).where(eq(questions.id, this.id));
        await Question.logger.info(`Question ${this.id} answers updated`);
    }

    // points getter/setter and funcs
    get points() {
        return this._points;
    }

    set points(value: number) {
        this._points = value;
        if (this.initialized) {
            this.updatePoints(value);
        }
    }

    async updatePoints(value: number) {
        if (!this.id || !this.initialized) {
            throw new Error("Question not instantiated");
        }
        await db.update(questions).set({ points: value }).where(eq(questions.id, this.id));
        await Question.logger.info(`Question ${this.id} points updated - ${value}`);
    }

    // type getter/setter and funcs
    get type() {
        return this._type;
    }

    set type(value: QuestionType) {
        this._type = value;
        if (this.initialized) {
            this.updateType(value);
        }
    }

    async updateType(value: QuestionType) {
        if (!this.id) {
            throw new Error("Question not instantiated");
        }
        await db.update(questions).set({ type: value }).where(eq(questions.id, this.id));
        await Question.logger.info(`Question ${this.id} type updated to '${value}' from '${this._type}'`);
    }

    async delete() {
        if (!this.id) {
            throw new Error("Question not instantiated");
        }
        await db.delete(questions).where(eq(questions.id, this.id));
        await Question.normalizePositions();
        (this.id as string | null) = null;
        (this.initialized as boolean) = false;
        await Question.logger.info(`Question ${this.id} deleted`);
    }

    async moveUp() {
        if (!this.id) {
            throw new Error("Question not instantiated");
        }
        if (this.position === 0) {
            return;
        }
        await this.updatePosition(this.position - 1);
    }

    async moveDown() {
        if (!this.id) {
            throw new Error("Question not instantiated");
        }
        await this.updatePosition(this.position + 1);
    }

    // response check
    checkAnswer(answer: string) {
        return this._answers.includes(answer.replace(/\W/g, "").toLowerCase());
    }
}