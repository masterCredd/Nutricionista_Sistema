CREATE TYPE agendamento_status AS ENUM (
  'agendado',
  'confirmado',
  'compareceu',
  'faltou',
  'cancelado'
);

CREATE TYPE dia_semana AS ENUM (
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado'
);
