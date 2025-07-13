// Constructor cho Task (object, prototype)
function Task(
  title, // Tiêu đề công việc
  description, // Mô tả công việc
  category, // Loại công việc
  priority, // Độ ưu tiên
  startTime, // Thời gian bắt đầu
  endTime, // Thời gian kết thúc
  dueDate, // Ngày hết hạn
  cardColor // Màu thẻ
) {
  this.title = title; // Gán tiêu đề
  this.description = description; // Gán mô tả
  this.category = category; // Gán loại
  this.priority = priority; // Gán độ ưu tiên
  this.startTime = startTime; // Gán thời gian bắt đầu
  this.endTime = endTime; // Gán thời gian kết thúc
  this.dueDate = dueDate; // Gán ngày hết hạn
  this.cardColor = cardColor; // Gán màu thẻ
  this.isCompleted = false; // Mặc định chưa hoàn thành
}
Task.prototype.markCompleted = function () {
  this.isCompleted = true; // Đánh dấu đã hoàn thành
};

// ==== Mảng lưu tasks mẫu ====
// Mảng lưu các task mẫu ban đầu
let todoTasks = [];

// ==== Biến filter/search trạng thái (let vì sẽ thay đổi) ====
let currentFilter = "all"; // Biến lưu trạng thái filter hiện tại (all, active, completed)
let currentSearch = ""; // Biến lưu từ khóa tìm kiếm hiện tại

// ==== DOM select ====
// Lấy các phần tử DOM cần dùng
const addBtn = document.querySelector(".add-btn"); // Nút mở modal thêm task
const addTaskModal = document.getElementById("addTaskModal"); // Modal thêm/sửa task
const closeModalBtn = document.querySelector(".modal-close"); // Nút đóng modal
const formElement = document.querySelector(".todo-app-form"); // Form nhập task
const firstInput = document.querySelector("input"); // Ô nhập đầu tiên
const firstTextarea = document.querySelector("textarea"); // Ô nhập mô tả
const firstSelect = document.querySelector("select"); // Ô chọn category
const cancelBtn = document.querySelector(".modal-footer .btn-secondary"); // Nút hủy
const createTaskBtn = document.querySelector(".modal-footer .btn-primary"); // Nút tạo task
const taskList = document.querySelector(".task-grid"); // Vùng hiển thị danh sách task
const tabButtons = document.querySelectorAll(".tab-list .tab-button"); // Các nút tab filter
const searchInput = document.querySelector(".search-input"); // Ô tìm kiếm
const toast = document.getElementById("toast"); // Vùng hiển thị thông báo

// Hàm toast message
// Hàm hiển thị thông báo toast
function showToast(msg, type = "success") {
  if (!toast) return; // Nếu không có vùng toast thì thoát
  const div = document.createElement("div"); // Tạo thẻ div mới
  div.className = "toast-message"; // Gán class
  div.style.background = type === "error" ? "#e74c3c" : "#222"; // Đổi màu theo loại
  div.textContent = msg; // Gán nội dung
  toast.appendChild(div); // Thêm vào vùng toast
  setTimeout(() => div.remove(), 3000); // Tự động ẩn sau 3s
}

// ==== Đóng/mở modal bằng classList.toggle ====
// Hàm mở modal
function openModal() {
  addTaskModal.classList.add("show"); // Hiện modal
  setTimeout(() => firstInput.focus(), 100); // Focus vào ô nhập đầu tiên
}
// Hàm đóng modal
function closeModal() {
  addTaskModal.classList.remove("show"); // Ẩn modal
}
addBtn.addEventListener("click", openModal); // Sự kiện mở modal
closeModalBtn.addEventListener("click", closeModal); // Sự kiện đóng modal
cancelBtn.addEventListener("click", closeModal); // Sự kiện hủy

// ==== Tạo & lưu task mới ====
// Sự kiện click nút tạo task
createTaskBtn.addEventListener("click", async function (e) {
  e.preventDefault(); // Ngăn submit mặc định
  // Lấy dữ liệu từ form
  const title = document.getElementById("taskTitle").value.trim(); // Tiêu đề
  const description = document.getElementById("taskDescription").value.trim(); // Mô tả
  const category = document.getElementById("taskCategory").value; // Loại
  const priority = document.getElementById("taskPriority").value; // Độ ưu tiên
  const startTime = document.getElementById("startTime").value; // Bắt đầu
  const endTime = document.getElementById("endTime").value; // Kết thúc
  const dueDate = document.getElementById("taskDate").value; // Ngày hết hạn
  const cardColor = document.getElementById("taskColor").value; // Màu thẻ

  if (!title) {
    // Nếu chưa nhập tiêu đề
    showToast("Vui lòng nhập tiêu đề task!", "error"); // Báo lỗi
    document.getElementById("taskTitle").focus(); // Focus lại
    return;
  }
  // Kiểm tra trùng tiêu đề
  const isDuplicate = todoTasks.some(
    (t) => t.title.trim().toLowerCase() === title.toLowerCase()
  );
  if (isDuplicate) {
    showToast("Tiêu đề task đã tồn tại!", "error");
    document.getElementById("taskTitle").focus();
    return;
  }

  const newTask = {
    title,
    description,
    category,
    priority,
    startTime,
    endTime,
    dueDate,
    cardColor,
    isCompleted: false,
    createAt: new Date(),
  };

  try {
    const res = await fetch("http://localhost:3000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTask),
    });
    const result = await res.json();
    todoTasks.unshift(result); // Thêm task mới vào đầu mảng
    formElement.reset(); // Reset form
    closeModal(); // Đóng modal
    currentSearch = ""; // Reset tìm kiếm
    searchInput.value = "";
    setActiveTab("all"); // Chuyển về tab all
    showToast("Đã thêm task mới thành công!"); // Hiện thông báo
    renderTasks(); // Render lại giao diện
  } catch (error) {
    console.error("Error creating task:", error); // Log lỗi
    showToast("Lỗi khi tạo task mới!", "error"); // Hiện thông báo lỗi
  }
});

// Sự kiện submit form (dùng cho tạo hoặc sửa)
formElement.addEventListener("submit", function (e) {
  e.preventDefault(); // Ngăn submit mặc định
  // Nếu đang edit
  if (formElement.dataset.editIndex) {
    let idx = Number(formElement.dataset.editIndex); // Lấy vị trí task đang sửa
    if (todoTasks[idx]) {
      const task = todoTasks[idx]; // Lấy object task cũ
      // Lấy dữ liệu mới từ form
      const updatedTask = {
        ...task,
        title: document.getElementById("taskTitle").value.trim(),
        description: document.getElementById("taskDescription").value.trim(),
        category: document.getElementById("taskCategory").value,
        priority: document.getElementById("taskPriority").value,
        startTime: document.getElementById("startTime").value,
        endTime: document.getElementById("endTime").value,
        dueDate: document.getElementById("taskDate").value,
        cardColor: document.getElementById("taskColor").value,
      };
      // Cập nhật vào db.json nếu có id
      if (task.id) {
        fetch(`http://localhost:3000/tasks/${task.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        })
          .then((res) => res.json())
          .then((result) => {
            todoTasks[idx] = result; // Cập nhật lại mảng với dữ liệu mới từ server
            showToast("Đã cập nhật task thành công!"); // Hiện thông báo thành công
            formElement.reset(); // Reset form
            closeModal(); // Đóng modal
            delete formElement.dataset.editIndex; // Xóa trạng thái edit
            renderTasks(); // Render lại giao diện
          })
          .catch(() => {
            showToast("Lỗi khi cập nhật task!", "error"); // Hiện thông báo lỗi
          });
      } else {
        // Nếu là task mẫu, chỉ cập nhật ở mảng
        todoTasks[idx] = updatedTask; // Cập nhật lại mảng với dữ liệu mới
        showToast("Đã cập nhật task thành công!"); // Hiện thông báo thành công
        formElement.reset(); // Reset form
        closeModal(); // Đóng modal
        delete formElement.dataset.editIndex; // Xóa trạng thái edit
        renderTasks(); // Render lại giao diện
      }
    }
  } else {
    handleCreateTask(); // Nếu không phải edit thì tạo mới
  }
});

// Hàm tạo task mới (dùng cho submit form khi không phải edit)
function handleCreateTask() {
  const title = document.getElementById("taskTitle").value.trim(); // Lấy tiêu đề
  if (!title) {
    // Nếu chưa nhập tiêu đề
    showToast("Vui lòng nhập tiêu đề task!", "error"); // Báo lỗi
    document.getElementById("taskTitle").focus(); // Focus lại
    return;
  }
  // Kiểm tra trùng tiêu đề
  const isDuplicate = todoTasks.some(
    (t) => t.title.trim().toLowerCase() === title.toLowerCase()
  );
  if (isDuplicate) {
    showToast("Tiêu đề task đã tồn tại!", "error");
    document.getElementById("taskTitle").focus();
    return;
  }
  // ...code tạo task mới đã được xử lý ở createTaskBtn...
}

// ==== Tab filter bằng classList ====
// Sự kiện click tab filter
tabButtons.forEach(function (tab, i) {
  tab.addEventListener("click", function () {
    setActiveTab(i === 0 ? "active" : "completed"); // Đổi trạng thái filter
    currentSearch = ""; // Reset tìm kiếm
    searchInput.value = "";
    renderTasks(); // Render lại giao diện
  });
});

// Hàm đổi trạng thái filter tab
function setActiveTab(filter) {
  currentFilter = filter === "all" ? "active" : filter; // Nếu là all thì chuyển về active
  tabButtons.forEach((tab, i) => {
    if (
      (filter === "active" && i === 0) ||
      (filter === "completed" && i === 1)
    ) {
      tab.classList.add("active"); // Tab được chọn
    } else {
      tab.classList.remove("active"); // Tab không được chọn
    }
  });
  if (filter === "all") {
    tabButtons[0].classList.remove("active");
    tabButtons[1].classList.remove("active");
  }
}

// ==== Tìm kiếm realtime (lọc theo keyword, bỏ tab) ====
// Sự kiện tìm kiếm realtime
searchInput.addEventListener("input", function () {
  const value = this.value; // Lấy giá trị nhập
  currentSearch = value; // Lưu vào biến
  tabButtons.forEach((tab) => tab.classList.remove("active")); // Bỏ active tab
  currentFilter = "all"; // Chuyển về all
  renderTasks(); // Render lại giao diện
});

// ==== Phòng chống XSS: Render task bằng createElement + textContent ====
// Hàm render danh sách task ra giao diện
function renderTasks() {
  let filteredTasks = todoTasks; // Mảng task sau khi lọc
  // Nếu tab là completed thì chỉ lấy task đã hoàn thành
  if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter((t) => t.isCompleted);
  }
  // Nếu có từ khóa tìm kiếm thì lọc theo tiêu đề hoặc mô tả
  if (currentSearch.trim()) {
    const keyword = currentSearch.trim().toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        (task.title && task.title.toLowerCase().includes(keyword)) ||
        (task.description && task.description.toLowerCase().includes(keyword))
    );
  }

  taskList.innerHTML = ""; // Xóa giao diện cũ
  if (filteredTasks.length === 0) {
    const notFound = document.createElement("div"); // Tạo thông báo không tìm thấy
    notFound.className = "not-found-message";
    notFound.textContent = "Không tìm thấy task nào.";
    taskList.appendChild(notFound);
    return;
  }

  filteredTasks.forEach(function (task, idx) {
    const trueIndex = todoTasks.indexOf(task); // Lấy index thực trong mảng gốc

    // Tạo card task
    const card = document.createElement("div");
    card.className = `task-card ${task.cardColor} ${
      task.isCompleted ? "completed" : ""
    }`;

    // Header
    const header = document.createElement("div");
    header.className = "task-header";
    const h3 = document.createElement("h3");
    h3.className = "task-title";
    h3.textContent = task.title;
    header.appendChild(h3);

    // Dropdown menu
    const btnMenu = document.createElement("button");
    btnMenu.className = "task-menu";
    btnMenu.innerHTML = `
            <i class="fa-solid fa-ellipsis fa-icon"></i>
            <div class="dropdown-menu">
                <div class="dropdown-item edit" data-index="${trueIndex}">
                    <i class="fa-solid fa-pen-to-square fa-icon"></i>
                    Edit
                </div>
                <div class="dropdown-item complete" data-index="${trueIndex}">
                    <i class="fa-solid fa-check fa-icon"></i>
                    ${task.isCompleted ? "Mark as Active" : "Mark as Complete"}
                </div>
                <div class="dropdown-item delete" data-index="${trueIndex}">
                    <i class="fa-solid fa-trash fa-icon"></i>
                    Delete
                </div>
            </div>
        `;
    header.appendChild(btnMenu);

    card.appendChild(header);

    // Description
    const desc = document.createElement("p");
    desc.className = "task-description";
    desc.textContent = task.description;
    card.appendChild(desc);

    // Time
    const time = document.createElement("div");
    time.className = "task-time";
    time.textContent =
      task.startTime && task.endTime
        ? `${task.startTime} - ${task.endTime}`
        : "";
    card.appendChild(time);

    // Meta info
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = `Category: ${task.category || "-"} | Priority: ${
      task.priority || "-"
    } | Due: ${task.dueDate || "-"}`;
    card.appendChild(meta);

    taskList.appendChild(card); // Thêm card vào giao diện
  });

  // Sự kiện dropdown: complete
  taskList.querySelectorAll(".dropdown-item.complete").forEach(function (btn) {
    btn.onclick = function () {
      let idx = Number(this.getAttribute("data-index")); // Lấy index task
      if (todoTasks[idx]) {
        todoTasks[idx].isCompleted = !todoTasks[idx].isCompleted; // Đổi trạng thái hoàn thành
        renderTasks(); // Render lại giao diện
        showToast(
          todoTasks[idx].isCompleted
            ? "Đã hoàn thành task!"
            : "Đã chuyển về chưa hoàn thành!"
        );
      }
    };
  });

  // Sự kiện dropdown: delete
  taskList.querySelectorAll(".dropdown-item.delete").forEach(function (btn) {
    btn.onclick = async function () {
      let idx = Number(this.getAttribute("data-index")); // Lấy index task
      if (typeof idx === "number" && idx >= 0) {
        const task = todoTasks[idx]; // Lấy object task
        if (task && task.id) {
          try {
            await fetch(`http://localhost:3000/tasks/${task.id}`, {
              method: "DELETE",
            }); // Xóa trên server
            showToast("Xóa task thành công!"); // Hiện thông báo
            todoTasks.splice(idx, 1); // Xóa khỏi mảng
            renderTasks(); // Render lại giao diện
          } catch (error) {
            showToast("Lỗi khi xóa task!", "error"); // Hiện thông báo lỗi
          }
        } else {
          // Nếu không có id (task mẫu), chỉ xóa ở mảng
          showToast("Xóa task thành công!");
          todoTasks.splice(idx, 1);
          renderTasks();
        }
      }
    };
  });

  // Sự kiện dropdown: edit
  taskList.querySelectorAll(".dropdown-item.edit").forEach(function (btn) {
    btn.onclick = function () {
      let idx = Number(this.getAttribute("data-index")); // Lấy index task

      if (todoTasks[idx]) {
        const task = todoTasks[idx]; // Lấy object task
        document.getElementById("taskTitle").value = task.title; // Đổ dữ liệu vào form
        document.getElementById("taskDescription").value = task.description;
        document.getElementById("taskCategory").value = task.category;
        document.getElementById("taskPriority").value = task.priority;
        document.getElementById("startTime").value = task.startTime;
        document.getElementById("endTime").value = task.endTime;
        document.getElementById("taskDate").value = task.dueDate;
        document.getElementById("taskColor").value = task.cardColor;

        openModal(); // Mở modal
        // Lưu index để cập nhật sau khi sửa
        formElement.dataset.editIndex = idx;

        // Ẩn nút tạo, hiện nút lưu
        createTaskBtn.style.display = "none";
        let editTaskBtn = document.getElementById("editTaskBtn");
        if (!editTaskBtn) {
          editTaskBtn = document.createElement("button");
          editTaskBtn.id = "editTaskBtn";
          editTaskBtn.className = "btn btn-primary";
          editTaskBtn.textContent = "Lưu thay đổi";
          createTaskBtn.parentNode.insertBefore(
            editTaskBtn,
            createTaskBtn.nextSibling
          );
        } else {
          editTaskBtn.style.display = "inline-block";
        }

        // Gán sự kiện lưu thay đổi
        editTaskBtn.onclick = function () {
          let idx = Number(formElement.dataset.editIndex); // Lấy vị trí task đang sửa trong mảng

          if (todoTasks[idx]) {
            // Nếu tồn tại task ở vị trí đó
            const task = todoTasks[idx]; // Lấy object task cũ
            const updatedTask = {
              // Tạo object mới với dữ liệu đã chỉnh sửa
              id: task.id, // Giữ lại id cũ
              title: document.getElementById("taskTitle").value.trim(), // Lấy tiêu đề mới
              description: document
                .getElementById("taskDescription")
                .value.trim(), // Lấy mô tả mới
              category: document.getElementById("taskCategory").value, // Lấy category mới
              priority: document.getElementById("taskPriority").value, // Lấy priority mới
              startTime: document.getElementById("startTime").value, // Lấy thời gian bắt đầu mới
              endTime: document.getElementById("endTime").value, // Lấy thời gian kết thúc mới
              dueDate: document.getElementById("taskDate").value, // Lấy ngày hết hạn mới
              cardColor: document.getElementById("taskColor").value, // Lấy màu thẻ mới
            };
            if (task.id) {
              // Nếu là task thật (có id)
              fetch(`http://localhost:3000/tasks/${task.id}`, {
                // Gửi yêu cầu PUT lên server để cập nhật
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedTask), // Gửi dữ liệu mới
              })
                .then((res) => res.json()) // Chuyển response thành object
                .then((result) => {
                  todoTasks[idx] = result; // Cập nhật lại mảng với dữ liệu mới từ server
                  showToast("Đã cập nhật task thành công!"); // Hiện thông báo thành công
                  formElement.reset(); // Reset form
                  closeModal(); // Đóng modal
                  delete formElement.dataset.editIndex; // Xóa trạng thái edit
                  editTaskBtn.style.display = "none"; // Ẩn nút lưu
                  createTaskBtn.style.display = "inline-block"; // Hiện lại nút tạo
                  renderTasks(); // Render lại giao diện
                })
                .catch(() => {
                  showToast("Lỗi khi cập nhật task!", "error"); // Hiện thông báo lỗi
                });
            } else {
              // Nếu là task mẫu (không có id)
              todoTasks[idx] = updatedTask; // Cập nhật lại mảng với dữ liệu mới
              showToast("Đã cập nhật task thành công!"); // Hiện thông báo thành công
              formElement.reset(); // Reset form
              closeModal(); // Đóng modal
              delete formElement.dataset.editIndex; // Xóa trạng thái edit
              editTaskBtn.style.display = "none"; // Ẩn nút lưu
              createTaskBtn.style.display = "inline-block"; // Hiện lại nút tạo
              renderTasks(); // Render lại giao diện
            }
          }
        };
      }
    };
  });
}

// Hàm lấy dữ liệu từ db.json khi mở giao diện
async function start() {
  try {
    // Sửa lại: sort theo id giảm dần để task mới luôn ở đầu
    const res = await fetch("http://localhost:3000/tasks?_sort=createAt"); // Lấy danh sách task mới nhất lên đầu
    const tasks = await res.json(); // Chuyển response thành mảng object
    todoTasks = tasks; // Gán vào mảng todoTasks
    renderTasks(); // Render ra giao diện
  } catch (error) {
    console.error("Error fetching tasks:", error); // Log lỗi
  }
}

start(); // Gọi hàm lấy dữ liệu khi mở giao diện

// ==== Render lần đầu khi load trang ====
renderTasks(); // Render giao diện lần đầu
