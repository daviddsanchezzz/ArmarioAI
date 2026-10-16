import {
  COLOR_PALETTE,
  COLORS,
  FORMALITY_MAX,
  GARMENT_CATEGORIES,
  SEASONS,
  type GarmentColor,
  type GarmentTags,
  type Season,
} from '@armario/shared';
import { StyleSheet, View } from 'react-native';
import { CATEGORY_LABELS, COLOR_LABELS, FORMALITY_LABELS, SEASON_LABELS } from '@/lib/labels';
import { spacing } from '@/theme/tokens';
import { AppText } from '../ui/AppText';
import { Chip } from '../ui/Chip';
import { TextField } from '../ui/TextField';

/** Valores del formulario: todos presentes, para editarlos sin undefined. */
export type TagValues = Required<{ [K in keyof GarmentTags]: NonNullable<GarmentTags[K]> | null }> & {
  colors: GarmentColor[];
  seasons: Season[];
};

export const emptyTags: TagValues = {
  category: null,
  subcategory: null,
  colors: [],
  pattern: null,
  material: null,
  seasons: [],
  formality: null,
  brand: null,
  notes: null,
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const textOrNull = (value: string) => (value.trim() === '' ? null : value);

interface TagEditorProps {
  value: TagValues;
  onChange: (value: TagValues) => void;
}

export function TagEditor({ value, onChange }: TagEditorProps) {
  const set = <K extends keyof TagValues>(key: K, next: TagValues[K]) => onChange({ ...value, [key]: next });

  return (
    <View style={styles.form}>
      <Section title="Categoría">
        {GARMENT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={CATEGORY_LABELS[category]}
            selected={value.category === category}
            onPress={() => set('category', value.category === category ? null : category)}
          />
        ))}
      </Section>

      <TextField
        label="Tipo (camiseta, vaqueros, botines…)"
        value={value.subcategory ?? ''}
        onChangeText={(text) => set('subcategory', textOrNull(text))}
        maxLength={60}
      />

      <Section title="Colores">
        {COLORS.map((color) => (
          <Chip
            key={color}
            label={COLOR_LABELS[color]}
            swatch={COLOR_PALETTE[color]}
            selected={value.colors.includes(color)}
            onPress={() => {
              const next = toggle(value.colors, color);
              if (next.length <= 5) set('colors', next);
            }}
          />
        ))}
      </Section>

      <Section title="Estaciones">
        {SEASONS.map((season) => (
          <Chip
            key={season}
            label={SEASON_LABELS[season]}
            selected={value.seasons.includes(season)}
            onPress={() => set('seasons', toggle(value.seasons, season))}
          />
        ))}
      </Section>

      <Section title="Formalidad">
        {Array.from({ length: FORMALITY_MAX }, (_, i) => i + 1).map((level) => (
          <Chip
            key={level}
            label={`${level} · ${FORMALITY_LABELS[level]}`}
            selected={value.formality === level}
            onPress={() => set('formality', value.formality === level ? null : level)}
          />
        ))}
      </Section>

      <TextField
        label="Estampado"
        value={value.pattern ?? ''}
        onChangeText={(text) => set('pattern', textOrNull(text))}
        maxLength={60}
      />
      <TextField
        label="Material"
        value={value.material ?? ''}
        onChangeText={(text) => set('material', textOrNull(text))}
        maxLength={60}
      />
      <TextField
        label="Marca"
        value={value.brand ?? ''}
        onChangeText={(text) => set('brand', textOrNull(text))}
        maxLength={100}
      />
      <TextField
        label="Notas"
        value={value.notes ?? ''}
        onChangeText={(text) => set('notes', textOrNull(text))}
        maxLength={1000}
        multiline
        style={styles.notes}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" muted>
        {title}
      </AppText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  section: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  notes: { minHeight: 90, paddingTop: spacing.md, textAlignVertical: 'top' },
});
