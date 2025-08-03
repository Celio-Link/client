import { LinkStatus, CommandType } from './linkDevice';

export enum ErrorType {
  ClientNotFound = 'client-not-found',
  ClientAlreadyInSession = 'client-already-in-session',
}

export type JoinMessage = {
  type: 'join';
  id: string;
};

export type SessionCreationMessage = {
  type: 'sessionCreate';
  otherId: string;
};

export type ErrorMessage = {
  type: 'error';
  errorType: ErrorType;
}

export type StatusMessage = {
  type: 'status';
  statusType: LinkStatus;
};

export type CommandMessage = {
  type: 'command';
  commandType: CommandType;
};
