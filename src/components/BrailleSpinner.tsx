import { Text } from '@mantine/core';
import classes from './BrailleSpinner.module.css';

interface BrailleSpinnerProps {
  color: string;
}

export function BrailleSpinner({ color }: BrailleSpinnerProps) {
  return (
    <Text
      component="span"
      size="md"
      fw={700}
      className={classes.spinner}
      style={{ color, width: 12, textAlign: 'center', flexShrink: 0 }}
    />
  );
}
