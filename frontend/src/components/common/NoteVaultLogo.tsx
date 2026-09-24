import noteVaultIcon from '@/assets/notevault-icon.svg'

interface NoteVaultLogoProps {
  className?: string
  size?: number
}

export function NoteVaultLogo({ className = '', size = 32 }: NoteVaultLogoProps) {
  return (
    <img
      src={noteVaultIcon}
      alt="NoteVault Logo"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      loading="eager"
      decoding="async"
    />
  )
}
