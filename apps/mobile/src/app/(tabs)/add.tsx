import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { emptyTags, TagEditor, type TagValues } from '@/components/garments/TagEditor';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useCreateGarment, type NewGarmentPhoto } from '@/hooks/useGarments';
import { nonEmptyTags } from '@/lib/tags';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

export default function AddGarmentScreen() {
  const { colors } = useTheme();
  const [photo, setPhoto] = useState<NewGarmentPhoto | null>(null);
  const [tags, setTags] = useState<TagValues>(emptyTags);
  const createGarment = useCreateGarment();

  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Sin permiso', 'Activa el acceso en los ajustes del teléfono para añadir prendas.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.canceled ? undefined : result.assets[0];
    if (asset) setPhoto({ uri: asset.uri, width: asset.width, height: asset.height });
  }

  function reset() {
    setPhoto(null);
    setTags(emptyTags);
    createGarment.reset();
  }

  function save() {
    if (!photo) return;
    createGarment.mutate(
      { photo, tags: nonEmptyTags(tags) },
      {
        onSuccess: (garment) => {
          reset();
          router.push({ pathname: '/garment/[id]', params: { id: garment.id } });
        },
      },
    );
  }

  if (!photo) {
    return (
      <Screen contentStyle={styles.empty}>
        <View style={styles.intro}>
          <AppText variant="title">Añadir prenda</AppText>
          <AppText muted>
            Extiende la prenda sobre un fondo liso, con buena luz, y encuádrala entera desde arriba.
          </AppText>
        </View>
        <Button label="Hacer foto" onPress={() => pick('camera')} />
        <Button label="Elegir de la galería" variant="secondary" onPress={() => pick('library')} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">Nueva prenda</AppText>
      <Image source={{ uri: photo.uri }} style={[styles.preview, { backgroundColor: colors.surface }]} />
      <AppText muted>Las etiquetas son opcionales; más adelante las rellenará la IA.</AppText>
      <TagEditor value={tags} onChange={setTags} />

      {createGarment.isError ? (
        <AppText color={colors.danger}>{createGarment.error.message}</AppText>
      ) : null}

      <Button label="Guardar en mi armario" onPress={save} loading={createGarment.isPending} />
      <Button label="Descartar" variant="ghost" onPress={reset} disabled={createGarment.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { justifyContent: 'center' },
  intro: { gap: spacing.sm, marginBottom: spacing.lg },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.lg },
});
