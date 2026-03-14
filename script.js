document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
            }
        });
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other open items
            const currentlyActive = document.querySelector('.faq-item.active');
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
                currentlyActive.querySelector('.faq-answer').style.maxHeight = null;
            }
            
            // Toggle current item
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // Supabase Configuration
    // These values will be injected automatically by GitHub Actions during deployment
    const SUPABASE_URL = '__SUPABASE_URL__'; 
    const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

    // Generic Form Submission Handler
    async function handleFormSubmit(data, source, formElement, successElement, submitButton) {
        // Prepare the payload for Supabase CaseEvaluations table
        // Note: Supabase will auto-generate the ID and createdAt if your table is configured correctly,
        // but we can send them explicitly or let the database handle default values.
        const payload = {
            source: source,
            ...data
        };

        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;

        try {
            // Check if keys are still placeholders (meaning local testing without injected secrets)
            if (SUPABASE_URL === '__SUPABASE_URL__' || SUPABASE_ANON_KEY === '__SUPABASE_ANON_KEY__') {
                console.warn('⚠️ GitHub Actions Secrets are missing or running locally. Form is simulating success but not saving to DB.');
                // Simulate a delay for local testing without keys
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // Actual Supabase POST request to the 'CaseEvaluations' table
                const response = await fetch(`${SUPABASE_URL}/rest/v1/CaseEvaluations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Prefer': 'return=minimal' // Optimizes response by not returning the inserted row
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error submitting to Supabase');
                }
                
                console.log('CaseEvaluation successfully recorded to Supabase!');
            }

            successElement.style.display = 'block';
            submitButton.innerHTML = source === 'Popup' ? 'Submit' : 'Consultation';
            submitButton.disabled = false; // Re-enable button
            formElement.reset();
            
            // Hide success message after 5 seconds so user can submit again cleanly
            setTimeout(() => {
                if (successElement) {
                    successElement.style.display = 'none';
                }
            }, 5000);
            
            return true;
        } catch (error) {
            console.error('Error submitting form:', error);
            submitButton.innerHTML = 'Error. Try Again';
            submitButton.disabled = false;
            return false;
        }
    }

    // Form Submission Handling
    const leadForm = document.getElementById('leadForm');
    const formSuccess = document.getElementById('formSuccess');
    
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = leadForm.querySelector('button[type="submit"]');
            const data = {
                fullName: document.getElementById('name').value,
                phoneNumber: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                loanType: document.getElementById('loanType').value,
                debtAmount: document.getElementById('amount').value,
            };

            await handleFormSubmit(data, 'EvaluationForm', leadForm, formSuccess, btn);
        });
    }

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                // Add an offset for the fixed header
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Timed Popup Logic
    const timedPopup = document.getElementById('timedPopup');
    const modalClose = document.querySelector('.modal-close');
    const popupForm = document.getElementById('popupForm');
    const modalFormContainer = document.getElementById('modalFormContainer');
    const modalSuccess = document.getElementById('modalSuccess');

    if (timedPopup) {
        // Trigger after 30 seconds
        setTimeout(() => {
            timedPopup.style.display = 'block';
        }, 30000);

        // Close on X click
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                timedPopup.style.display = 'none';
            });
        }

        // Close on outside click
        window.addEventListener('click', (event) => {
            if (event.target == timedPopup) {
                timedPopup.style.display = 'none';
            }
        });

        // Popup form submission
        if (popupForm) {
            popupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = popupForm.querySelector('button[type="submit"]');

                const data = {
                    fullName: document.getElementById('popupName').value,
                    phoneNumber: document.getElementById('popupPhone').value,
                };
                
                const isSuccess = await handleFormSubmit(data, 'Popup', popupForm, modalSuccess, btn);
                if (isSuccess) {
                    modalFormContainer.style.display = 'none';
                    setTimeout(() => {
                        timedPopup.style.display = 'none';
                    }, 3000); // Close automatically after 3 seconds
                }
            });
        }
    }
});
