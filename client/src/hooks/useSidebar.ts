import { useState } from 'react';
import { createToggleSidebar } from '@/handlers/layout/toggleSidebar';

export function useSidebar() {
  const [open, setOpen] = useState(true);
  return { open, onToggle: createToggleSidebar({ setOpen }) };
}
