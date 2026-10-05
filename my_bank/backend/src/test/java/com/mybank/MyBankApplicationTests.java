package com.mybank;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import com.mybank.support.AuthTestConfig;

@SpringBootTest
@ActiveProfiles("test")
class MyBankApplicationTests {

    @DynamicPropertySource
    static void credentials(DynamicPropertyRegistry registry) { AuthTestConfig.properties(registry); }

	@Test
	void contextLoads() {
	}

}
