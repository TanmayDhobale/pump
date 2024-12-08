import { Idl } from '@project-serum/anchor';
import pumpIdl from '../idl/pump.json';

export type PumpIdl = typeof pumpIdl;
export const IDL: PumpIdl = pumpIdl; 