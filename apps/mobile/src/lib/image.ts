import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_SIDE = 2048;

/** Reduce la foto a 2048 px como máximo y la guarda como JPEG. */
export async function prepareForUpload(uri: string, width: number, height: number) {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return result.uri;
}

export async function readFileBytes(uri: string): Promise<ArrayBuffer> {
  return new File(uri).arrayBuffer();
}
