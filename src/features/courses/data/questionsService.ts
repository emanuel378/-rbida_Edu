import { db } from '../../../lib/firebase'
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import type { Question } from './mock'

const COLLECTION = 'BancoQuest'

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateQuestionCode(): string {
  let result = 'QST-'
  for (let i = 0; i < 4; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return result
}

export function subscribeQuestions(
  callback: (questions: Question[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = collection(db, COLLECTION)

  return onSnapshot(
    ref,
    (snapshot) => {
      const questions = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Question[]

      callback(questions)
    },
    (error) => {
      console.error('Erro na inscrição do Firestore:', error)
      onError?.(error)
    }
  )
}

export async function addQuestion(question: Question): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTION, question.id), question)
  } catch (error) {
    console.error('Erro ao adicionar questão no Firestore:', error)
    throw error
  }
}

export async function deleteQuestion(questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, questionId))
  } catch (error) {
    console.error('Erro ao deletar questão no Firestore:', error)
    throw error
  }
}

export async function updateQuestion(question: Question): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTION, question.id), question, { merge: true })
  } catch (error) {
    console.error('Erro ao atualizar questão no Firestore:', error)
    throw error
  }
}
