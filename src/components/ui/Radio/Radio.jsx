"use client"

import styles from "./Radio.module.css"

export function Radio({
  id,
  label,
  description,
  value,
  checked,
  onChange,
  disabled = false,
  required = false,
  name,
  className = "",
  ...props
}) {
  const radioId = id || `radio-${Math.random().toString(36).slice(2, 9)}`

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <label className={styles.root} htmlFor={radioId}>
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          className={styles.input}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          required={required}
          {...props}
        />
        <span className={styles.box} aria-hidden="true">
          <span className={styles.dot} />
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}

export function RadioGroup({
  name,
  value,
  onChange,
  children,
  disabled = false,
  required = false,
  horizontal = false,
  className = "",
  ...props
}) {
  return (
    <fieldset
      className={`${styles.group} ${horizontal ? styles.horizontal : ""} ${className}`}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, {
          name,
          checked: child.props.value === value,
          onChange,
          disabled: disabled || child.props.disabled,
          required
        })
      })}
    </fieldset>
  )
}
