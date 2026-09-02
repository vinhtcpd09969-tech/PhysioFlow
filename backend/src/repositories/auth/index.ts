import authAccountRepository from './authAccount.repository';
import authTokenRepository from './authToken.repository';
import authProfileRepository from './authProfile.repository';

export {
  authAccountRepository,
  authTokenRepository,
  authProfileRepository
};

export class AuthRepository {
  // --- TÀI KHOẢN, XÁC THỰC & TÌM KIẾM ---
  findUserByEmail = authAccountRepository.findUserByEmail.bind(authAccountRepository);
  findStaffByEmail = authAccountRepository.findStaffByEmail.bind(authAccountRepository);
  findCustomerByEmail = authAccountRepository.findCustomerByEmail.bind(authAccountRepository);
  findActiveCustomerByEmail = authAccountRepository.findActiveCustomerByEmail.bind(authAccountRepository);
  createUser = authAccountRepository.createUser.bind(authAccountRepository);
  verifyEmail = authAccountRepository.verifyEmail.bind(authAccountRepository);
  findUserById = authAccountRepository.findUserById.bind(authAccountRepository);
  updateLastLogin = authAccountRepository.updateLastLogin.bind(authAccountRepository);

  // --- MÃ OTP & REFRESH TOKEN ---
  saveOTP = authTokenRepository.saveOTP.bind(authTokenRepository);
  findValidOTP = authTokenRepository.findValidOTP.bind(authTokenRepository);
  deleteOTPsByEmail = authTokenRepository.deleteOTPsByEmail.bind(authTokenRepository);
  saveRefreshToken = authTokenRepository.saveRefreshToken.bind(authTokenRepository);
  findValidRefreshToken = authTokenRepository.findValidRefreshToken.bind(authTokenRepository);

  // --- HỒ SƠ & MẬT KHẨU ---
  updatePassword = authProfileRepository.updatePassword.bind(authProfileRepository);
  updateProfile = authProfileRepository.updateProfile.bind(authProfileRepository);
  findPasswordHashById = authProfileRepository.findPasswordHashById.bind(authProfileRepository);
  changePassword = authProfileRepository.changePassword.bind(authProfileRepository);
}

export default new AuthRepository();
