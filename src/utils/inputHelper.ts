import * as readline from 'readline';

// Crear una interfaz para la entrada de la consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar al usuario y esperar la respuesta
export const input = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};
