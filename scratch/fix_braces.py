import os

path = r'c:\Users\ELCOT\Desktop\Task assinging paltform\backend\src\controllers\ticketController.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate after the first searchTickets };
# We know the file ends with:
# 876: };
# 877:     });
# 878:   }
# 879: };

new_lines = lines[:876]

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)
