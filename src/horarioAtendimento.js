/**
 * Verifica se está em horário de atendimento (mesmo padrão do conteudo.js).
 * Segunda 18h-22h | Terça a Quinta fechado | Sexta 10h-22h | Sábado e Domingo 9h-18h
 */

const config = require('./config');

const TIMEZONE = config.timezone || 'America/Sao_Paulo';

/** Horários por dia da semana (0=Dom, 1=Seg, ..., 6=Sab). null = fechado. { inicio, fim } em horas 0-23 */
const HORARIOS_POR_DIA = {
  0: { inicio: 9, fim: 18 },   // Domingo
  1: { inicio: 18, fim: 22 },  // Segunda
  2: null,                     // Terça
  3: null,                     // Quarta
  4: null,                     // Quinta
  5: { inicio: 10, fim: 22 },  // Sexta
  6: { inicio: 9, fim: 18 },   // Sábado
};

/**
 * Retorna true se o momento atual (no fuso configurado) está dentro do horário de atendimento.
 */
function estaEmHorarioAtendimento() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(now);
  let weekday = '';
  let hour = 0;
  for (const p of parts) {
    if (p.type === 'weekday') weekday = p.value;
    if (p.type === 'hour') hour = parseInt(p.value, 10);
  }
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dia = dayMap[weekday] ?? now.getDay();
  const regra = HORARIOS_POR_DIA[dia];
  if (!regra) return false;
  return hour >= regra.inicio && hour < regra.fim;
}

module.exports = {
  estaEmHorarioAtendimento,
  TIMEZONE,
};
