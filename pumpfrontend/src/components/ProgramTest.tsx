'use client';

import { useProgram } from '@/hooks/useProgram';
import { useEffect, useState } from 'react';
import { STATE_ADDRESS } from '@/constants';

export const ProgramTest = () => {
  const { program } = useProgram();
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    const fetchState = async () => {
      if (!program) return;
      try {
        const stateAccount = await program.account.stateAccount.fetch(STATE_ADDRESS);
        setState(stateAccount);
      } catch (error) {
        console.error('Error fetching state:', error);
      }
    };

    fetchState();
  }, [program]);

  if (!state) return <div>Loading...</div>;

  return (
    <div>
      <h2>Program State</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
}; 