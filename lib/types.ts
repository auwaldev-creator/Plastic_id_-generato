export interface FieldPosition {
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
}

export interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FieldPositions {
  photo: PhotoPosition;
  surname: FieldPosition;
  givenNames: FieldPosition;
  nin: FieldPosition;
  dateOfBirth: FieldPosition;
  sex: FieldPosition;
}

export interface MaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FormData {
  surname: string;
  givenNames: string;
  nin: string;
  dateOfBirth: string;
  sex: string;
  photo: string | null;
}

export interface Preset {
  name: string;
  positions: FieldPositions;
  masks: MaskRect[];
}

export const DEFAULT_POSITIONS: FieldPositions = {
  photo: { x: 50, y: 200, width: 100, height: 120 },
  surname: { x: 170, y: 220, fontSize: 11, fontColor: "#000000" },
  givenNames: { x: 170, y: 245, fontSize: 11, fontColor: "#000000" },
  nin: { x: 170, y: 270, fontSize: 11, fontColor: "#000000" },
  dateOfBirth: { x: 170, y: 295, fontSize: 11, fontColor: "#000000" },
  sex: { x: 170, y: 320, fontSize: 11, fontColor: "#000000" },
};
  
