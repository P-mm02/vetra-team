type Translate = (english: string, thai: string) => string

export function userRoleLabel(role: string, t: Translate) {
  switch (role) {
    case 'dev': return t('Developer', 'นักพัฒนา')
    case 'admin': return t('Administrator', 'ผู้ดูแลระบบ')
    case 'editor': return t('Editor', 'ผู้แก้ไขเนื้อหา')
    default: return t('Viewer', 'ผู้ดูข้อมูล')
  }
}

/** Keep server error codes stable while translating their presentation. */
export function userActionError(code: string, t: Translate, action: 'create' | 'edit' | 'password' | 'delete' = 'edit') {
  switch (code) {
    case 'missing': return t('Please fill in all required fields.', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
    case 'bad_email': return t('Email format looks invalid.', 'รูปแบบอีเมลไม่ถูกต้อง')
    case 'bad_username': return t('Username must be 3–30 characters, using English letters, numbers, underscores (_) or dots (.), with a letter or number at each end.', 'ชื่อผู้ใช้ต้องมี 3–30 ตัวอักษร ใช้อักษรภาษาอังกฤษ ตัวเลข ขีดล่าง (_) หรือจุด (.) และขึ้นต้นกับลงท้ายด้วยตัวอักษรหรือตัวเลข')
    case 'bad_password': return t('Password must be 8–200 characters.', 'รหัสผ่านต้องมี 8–200 ตัวอักษร')
    case 'no_match': return t('Passwords do not match.', 'รหัสผ่านไม่ตรงกัน')
    case 'dup_email': return t('This email is already used.', 'อีเมลนี้มีผู้ใช้งานแล้ว')
    case 'dup_username': return t('This username is already used.', 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว')
    case 'bad_role': return t('Choose a valid role for this account.', 'กรุณาเลือกสิทธิ์ที่ถูกต้องสำหรับบัญชีนี้')
    case 'bad_active': return t('Choose a valid access status.', 'กรุณาเลือกสถานะการเข้าถึงที่ถูกต้อง')
    case 'forbidden': return action === 'password'
      ? t('You don’t have permission to change this password.', 'คุณไม่มีสิทธิ์เปลี่ยนรหัสผ่านของบัญชีนี้')
      : action === 'delete'
        ? t('You don’t have permission to remove this account. Only a developer can remove another developer.', 'คุณไม่มีสิทธิ์ลบบัญชีนี้ เฉพาะผู้พัฒนาเท่านั้นที่ลบบัญชีผู้พัฒนาได้')
        : t('You don’t have permission to manage this account. Developer accounts can only be managed by a developer.', 'คุณไม่มีสิทธิ์จัดการบัญชีนี้ บัญชีผู้พัฒนาจัดการได้โดยผู้พัฒนาเท่านั้น')
    case 'self_edit': return t('You cannot change your own role or disable your own account here.', 'คุณไม่สามารถเปลี่ยนสิทธิ์หรือปิดใช้งานบัญชีของตนเองได้')
    case 'self_delete': return t('You cannot delete your own account.', 'คุณไม่สามารถลบบัญชีของตนเองได้')
    case 'bad_id': return t('Invalid user ID.', 'รหัสผู้ใช้ไม่ถูกต้อง')
    case 'last_privileged': return t('Keep at least one active account with this privileged role.', 'ต้องมีบัญชีที่เปิดใช้งานและมีสิทธิ์ระดับนี้อย่างน้อย 1 บัญชี')
    case 'conflict': return t('This account changed. Refresh the page and try again.', 'ข้อมูลบัญชีนี้มีการเปลี่ยนแปลง กรุณารีเฟรชหน้าแล้วลองอีกครั้ง')
    case 'csrf': return t('Your session could not be verified. Refresh and try again.', 'ไม่สามารถยืนยันเซสชันของคุณได้ กรุณารีเฟรชหน้าแล้วลองอีกครั้ง')
    default: return t('Something went wrong. Please try again.', 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
  }
}

const validationThai: Record<string, string> = {
  'Username is required.': 'กรุณากรอกชื่อผู้ใช้',
  'Username must be 3–30 characters.': 'ชื่อผู้ใช้ต้องมี 3–30 ตัวอักษร',
  'Only letters/numbers, underscore (_) or dot (.), no leading/trailing symbol.': 'ใช้ได้เฉพาะอักษรภาษาอังกฤษ ตัวเลข ขีดล่าง (_) หรือจุด (.) โดยห้ามขึ้นต้นหรือลงท้ายด้วยสัญลักษณ์',
  'Email is required.': 'กรุณากรอกอีเมล',
  'Email must be 3–254 characters.': 'อีเมลต้องมี 3–254 ตัวอักษร',
  'Email format looks invalid.': 'รูปแบบอีเมลไม่ถูกต้อง',
  'Password is required.': 'กรุณากรอกรหัสผ่าน',
  'Password must be 8–200 characters.': 'รหัสผ่านต้องมี 8–200 ตัวอักษร',
  'Please confirm password.': 'กรุณายืนยันรหัสผ่าน',
  'Passwords do not match.': 'รหัสผ่านไม่ตรงกัน',
}

export function userValidationMessage(message: string, t: Translate) {
  return t(message, validationThai[message] ?? 'กรุณาตรวจสอบข้อมูลแล้วลองอีกครั้ง')
}
