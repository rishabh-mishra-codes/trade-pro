package com.tradepro.auth.dto;

import com.tradepro.user.UserAccount;

public class UserResponse {

    private String id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String dateOfBirth;
    private String membershipStatus;
    private String theme;

    public static UserResponse from(UserAccount account) {
        UserResponse dto = new UserResponse();
        dto.id = account.getId().toString();
        dto.fullName = account.getFullName();
        dto.email = account.getEmail();
        dto.phoneNumber = account.getPhoneNumber();
        dto.address = account.getAddress();
        dto.dateOfBirth = account.getDateOfBirth();
        dto.membershipStatus = account.getMembershipStatus();
        dto.theme = account.getTheme();
        return dto;
    }

    public String getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public String getMembershipStatus() {
        return membershipStatus;
    }

    public String getTheme() {
        return theme;
    }
}
