export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(value: string): boolean {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcDigit = (slice: string, factor: number) => {
    let total = 0;
    for (const item of slice) {
      total += Number(item) * factor;
      factor -= 1;
    }
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 10), 11);
  return cpf === `${cpf.slice(0, 9)}${d1}${d2}`;
}

export function normalizeEmail(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function formatPhoneBr(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
