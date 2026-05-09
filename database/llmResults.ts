import { db } from './init';
import { LLMResult, LLMResultType } from '../types';

export const llmResultsDb = {

  save(result: LLMResult): void {
    db.runSync(
      `INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        result.id,
        result.eventId ?? null,
        result.userId,
        result.type,
        result.inputText,
        result.outputText,
        result.createdAt,
      ]
    );
  },

  getCached(userId: string, type: LLMResultType, inputText: string): LLMResult | null {
    const row = db.getFirstSync<LLMResult>(
      `SELECT * FROM llm_results
       WHERE userId = ? AND type = ? AND inputText = ?
       ORDER BY createdAt DESC LIMIT 1`,
      [userId, type, inputText]
    );
    return row ?? null;
  },

  getByUser(userId: string): LLMResult[] {
    return db.getAllSync<LLMResult>(
      'SELECT * FROM llm_results WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
  },
};
