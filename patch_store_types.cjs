const fs = require('fs');
let content = fs.readFileSync('src/store.tsx', 'utf-8');

// Add import for Discursiva
content = content.replace(
  'import { Edital, Materia, RevisaoAgendada, StudyCycle, StudyCycleItem } from "./types";',
  'import { Edital, Materia, RevisaoAgendada, StudyCycle, StudyCycleItem, Discursiva } from "./types";'
);

// Add to EditalContextType
const oldContext = `  getPublicCiclos: (editalId: string) => Promise<StudyCycle[]>;
}`;
const newContext = `  getPublicCiclos: (editalId: string) => Promise<StudyCycle[]>;
  discursivas: Discursiva[];
  addDiscursiva: (d: Discursiva) => void;
  updateDiscursiva: (d: Discursiva) => void;
  deleteDiscursiva: (id: string) => void;
  toggleDiscursiva: (id: string) => void;
}`;
content = content.replace(oldContext, newContext);

// Add to EditalProvider
const oldProviderStates = `  const [managedCiclos, setManagedCiclos] = useState<StudyCycle[]>([]);
  const [pinnedEditalId, setPinnedEditalIdState] = useState<string | null>(null);`;
const newProviderStates = `  const [managedCiclos, setManagedCiclos] = useState<StudyCycle[]>([]);
  const [discursivas, setDiscursivas] = useState<Discursiva[]>([]);
  const [pinnedEditalId, setPinnedEditalIdState] = useState<string | null>(null);`;
content = content.replace(oldProviderStates, newProviderStates);

fs.writeFileSync('src/store.tsx', content);
