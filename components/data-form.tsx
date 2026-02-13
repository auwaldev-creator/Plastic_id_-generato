"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import type { FormData } from "@/lib/types";

interface DataFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  errors: Record<string, string>;
}

export function DataForm({ formData, onChange, errors }: DataFormProps) {
  const update = (field: keyof FormData, value: string | null) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <PhotoUpload
        photo={formData.photo}
        onPhotoChange={(p) => update("photo", p)}
      />

      <div className="space-y-1.5">
        <Label
          htmlFor="surname"
          className="text-sm font-medium text-card-foreground"
        >
          Surname
        </Label>
        <Input
          id="surname"
          value={formData.surname}
          onChange={(e) => update("surname", e.target.value)}
          placeholder="e.g. OKELLO"
          className={errors.surname ? "border-destructive" : ""}
        />
        {errors.surname && (
          <p className="text-xs text-destructive">{errors.surname}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="givenNames"
          className="text-sm font-medium text-card-foreground"
        >
          Given Names
        </Label>
        <Input
          id="givenNames"
          value={formData.givenNames}
          onChange={(e) => update("givenNames", e.target.value)}
          placeholder="e.g. John James"
          className={errors.givenNames ? "border-destructive" : ""}
        />
        {errors.givenNames && (
          <p className="text-xs text-destructive">{errors.givenNames}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="nin"
          className="text-sm font-medium text-card-foreground"
        >
          NIN
        </Label>
        <Input
          id="nin"
          value={formData.nin}
          onChange={(e) => {
            const val = e.target.value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
            update("nin", val);
          }}
          placeholder="e.g. CM12345678ABCD"
          maxLength={20}
          className={errors.nin ? "border-destructive" : ""}
        />
        {errors.nin && (
          <p className="text-xs text-destructive">{errors.nin}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="dob"
          className="text-sm font-medium text-card-foreground"
        >
          Date of Birth
        </Label>
        <Input
          id="dob"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => update("dateOfBirth", e.target.value)}
          className={errors.dateOfBirth ? "border-destructive" : ""}
        />
        {errors.dateOfBirth && (
          <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="sex"
          className="text-sm font-medium text-card-foreground"
        >
          Sex
        </Label>
        <Select value={formData.sex} onValueChange={(v) => update("sex", v)}>
          <SelectTrigger
            id="sex"
            className={errors.sex ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Select sex" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
          </SelectContent>
        </Select>
        {errors.sex && (
          <p className="text-xs text-destructive">{errors.sex}</p>
        )}
      </div>
    </div>
  );
}
