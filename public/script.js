

// http://localhost:3000/api/guild/1248155923097063444/giverole/1317783929410813973/1317783929410813973
document.addEventListener('DOMContentLoaded', () => {
  const guildSelect = document.getElementById('selectGuildDropdown');
  const usersSelect = document.getElementById('roleUserDropdown');
  const rolesSelect = document.getElementById('selectRoleDropdown');
  const userToBanSelect = document.getElementById('banUserDropdown');
  const userToKickSelect = document.getElementById('kickUserDropdown');
  const userToUnbanSelect = document.getElementById('unbanUserInput');
  const loadcommands = document.getElementById('selectGuildBtn')
  const usertimeout = document.getElementById('timeoutusers')
  const chatFrame = document.getElementById('chat-frame')
  // Action buttons (ban, kick, etc)

  const banUserBtn = document.getElementById('banUserBtn')
  const kickUserBtn = document.getElementById('kickUserBtn')
  const caButton = document.getElementById('ca_button')
  const caInputbox = document.getElementById('ca_inputbox')
  const usertogiverole = document.getElementById('roleUserDropdown')
  const giveRoleButton = document.getElementById('assignRoleBtn')
  const timeoutButton = document.getElementById('to_button')
  const timeoutSecondsInput = document.getElementById('timeoutseconds')
  const unbanButton = document.getElementById('unbanUserBtn')
  

  // Fetch and populate guilds (for guild selection)
  fetch('/api/guilds')
    .then(response => response.json())
    .then(data => {
      data.forEach(guild => {
        const option = document.createElement('option');
        option.value = guild.id;
        option.textContent = guild.name;
        guildSelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching guilds:', error));
  
  
  
  caButton.addEventListener('click', () => {
    const guildId = guildSelect.value; // Get the selected guild ID
    const roleName = caInputbox.value; // Get the custom role name from the input box
    
    // If no role name, show an alert and return early

    console.log(roleName)
    if (!roleName) {
      alert('Please enter a role name!');
      return;
    }
    
    // Change the button text to indicate loading
    caButton.textContent = 'Creating...';
    
    // Send the POST request to create the Cloaked Admin role
    fetch(`/api/guild/${guildId}/createCloakedAdmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Ensure the content type is JSON
      },
      body: JSON.stringify({ roleName: roleName }), // Send the role name in the request body
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // If successful, update the button text with the success message
          caButton.textContent = data.message;
        } else {
          // If error, update the button text with the error message
          caButton.textContent = 'Error creating role';
        }
      })
      .catch(error => {
        // If there's an error with the request
        console.error('Error:', error);
        caButton.textContent = 'Error creating role';
      });
  });
  
  

  
    loadcommands.addEventListener('click', () => {
      const selectedGuildId = guildSelect.value;
      if (!selectedGuildId) return;

      // Clear all user-related dropdowns
      rolesSelect.innerHTML = '';
      usersSelect.innerHTML = '';
      userToBanSelect.innerHTML = '';
      userToKickSelect.innerHTML = '';
      userToUnbanSelect.innerHTML = '';
      usertimeout.innerHTML = '';


      populateRoles(selectedGuildId)
      // Fetch users for the selected guild
      fetch(`/api/guild/${selectedGuildId}/users`)
        .then(response => response.json())
        .then(users => {
          // Loop through the users and populate the dropdowns
          users.forEach(user => {
            const userOption = document.createElement('option');
            userOption.value = user.id;
            userOption.textContent = `${user.username}#${user.discriminator}`; // Format as "username#discriminator"

            // Add the user to all dropdowns
            usersSelect.appendChild(userOption);
            userToBanSelect.appendChild(userOption.cloneNode(true));
            userToKickSelect.appendChild(userOption.cloneNode(true));
        
            usertimeout.appendChild(userOption.cloneNode(true))
          });
        })
        .catch(error => console.error('Error fetching users:', error));
      
        
      
    });
  
    async function populateRoles(guildId) {
      try {
        const response = await fetch(`/api/guild/${guildId}/roles`);
        const roles = await response.json();
    
        // Sort roles by position in descending order (highest rank first)
        roles.sort((a, b) => b.position - a.position);
    
        rolesSelect.innerHTML = ''; // Clear the dropdown before adding new roles
    
        roles.forEach(role => {
          const option = document.createElement('option');
          option.value = role.id;
          option.textContent = `${role.name} (Position: ${role.position})`;
          rolesSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    }

    
  unbanButton.addEventListener('click', () => {
    console.log(userToUnbanSelect.value)
    unbanButton.textContent = "Attempting to unban user..."
    fetch(`/api/guild/${guildSelect.value}/unban/${userToUnbanSelect.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(response => response.json())
      .then(data => {
        if (!data.ok) {
          console.log(data.error)
          unbanButton.textContent = `Error unbanning user: ${data.error}`
        } else {
          unbanButton.textContent = `Succesfully unbanned`

        }
      })
  })  
  
  giveRoleButton.addEventListener('click', () => {
    // Change the button text to indicate loading
    guildId = guildSelect.value
    roleId = rolesSelect.value
    userId = usertogiverole.value
    giveRoleButton.textContent = 'Giving Role...';
    

    console.log(`Role to give in: ${guildId} with roleID of ${roleId} to ${userId}`)
    // Send the POST request to assign the role
    fetch(`/api/guild/${guildId}/giverole/${roleId}/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          giveRoleButton.textContent = 'Role Given!';
        } else {
          giveRoleButton.textContent = 'Error Giving Role';
          console.error(data.error);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        giveRoleButton.textContent = 'Error Giving Role';
      });
  })

  timeoutButton.addEventListener('click', async () => {
    const userId = usertimeout.value;
    const timeoutSeconds = parseInt(timeoutSecondsInput.value, 10);
    
    if (!userId || isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
      alert('Please select a user and enter a valid timeout duration in seconds.');
      return;
    }
  
    try {
      // Send the POST request to the server to timeout the user
      const response = await fetch(`/api/guild/${guildSelect.value}/timeout/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeoutSeconds }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error timing out user:', error);
      alert('An error occurred while trying to timeout the user.');
    }
  });


  function addChatMessage(message) {

    
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatFrame.appendChild(messageElement);
    chatFrame.scrollTop = chatFrame.scrollHeight; // Auto-scroll to the bottom
  }
  
  // Example of receiving chat messages via WebSocket (for real-time chat logging)
  const socket = new WebSocket('ws://js.decodetalles.com.ar:6121/api/socket'); // Replace with your WebSocket server URL
  
  socket.addEventListener('message', (event) => {
    const messageData = JSON.parse(event.data);
    
    const sender = messageData.sender; // Sender's username
    const guild = messageData.guild;   // Guild name
    const channel = messageData.channel; // Channel name
    const messageContent = messageData.message; // The actual message content
  
    // Format message with additional info
    const formattedMessage = ` [${guild}] [${channel}]  [${sender}]: ${messageContent}`;
    
    addChatMessage(formattedMessage);
  });
  

    document.getElementById('kickUserBtn').addEventListener("click", () => {
      const userId = userToKickSelect.value;
      const guildId = guildSelect.value;

      console.log(`User wants to kick ${userId} from guild ${guildId}`);
    
      // Change button text to indicate loading state
      kickUserBtn.textContent = "Kicking...";

      fetch(`/api/guild/${guildId}/kick/${userId}`, {
        method: 'POST',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to kick user');
          }
          return response.text(); // Expect plain text response
        })
        .then(message => {
          // Display success message in the button
          kickUserBtn.textContent = message;

          // Remove the kicked user from the dropdown
          userToKickSelect.querySelector(`option[value="${userId}"]`).remove();

          // Reset button text after 3 seconds
          setTimeout(() => {
            kickUserBtn.textContent = "Kick User";
          }, 3000);
        })
        .catch(error => {
          console.error('Error:', error);
          kickUserBtn.textContent = "Error kicking user";

          // Reset button text after 3 seconds
          setTimeout(() => {
            kickUserBtn.textContent = "Kick User";
          }, 3000);
        });
    });

    // fetch url to ban user with api

    banUserBtn.addEventListener("click", () => {
      const userId = userToBanSelect.value;
      const guildId = guildSelect.value;
  
      console.log(`User wants to ban ${userId} from guild ${guildId}`);
  
      // Change button text to indicate loading state
      banUserBtn.textContent = "Banning...";
  
      fetch(`/api/guild/${guildId}/ban/${userId}`, {
        method: 'POST',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to ban user');
          }
          return response.text(); // Expect plain text response
        })
        .then(message => {
          // Display success message in the button
          banUserBtn.textContent = message;
          userToBanSelect.querySelector(`option[value="${userId}"]`).remove();
  
          // Reset button text after 3 seconds
          setTimeout(() => {
            banUserBtn.textContent = "Ban User";
          }, 3000);
        })
        .catch(error => {
          console.error('Error:', error);
          banUserBtn.textContent = "Error banning user";
  
          // Reset button text after 3 seconds
          setTimeout(() => {
            banUserBtn.textContent = "Ban User";
          }, 3000);
        });
    
      
  


      //  function removeuser(userid); {

      //}
    
    });

 


    // Actions




    // document.getElementById('banUserBtn').addEventListener('click', () => { 
    // print('User requested to ban:', userToBanSelect.textContent,"in the Guild of:", guildSelect.textContent);
    // });

    //const banuser = document.getElementById('banUserBtn')
    //const kickuser = document.getElementById('kickUserBtn')
    //const assignrole = document.getElementById('assignRoleBtn')
  })
